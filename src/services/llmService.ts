import axios from 'axios';
import { Response } from 'express';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

export const generateLLMResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await axios.post(OLLAMA_API_URL, {
      model: 'llama3',
      prompt: prompt,
      stream: false
    });

    return response.data.response;
  } catch (error) {
    console.error('Error generando respuesta:', error);
    return 'Ocurrió un error al generar la respuesta.';
  }
};

export const generateLLMResponseStream = async (
  prompt: string, 
  res: Response
): Promise<void> => {
  try {
    // Configurar headers para Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const response = await axios.post(OLLAMA_API_URL, {
      model: 'llama3',
      prompt: prompt,
      stream: true
    }, {
      responseType: 'stream'
    });

    let fullResponse = '';

    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            
            if (data.response) {
              fullResponse += data.response;
              
              // Enviar chunk al cliente
              res.write(`data: ${JSON.stringify({
                content: data.response,
                done: data.done || false
              })}\n\n`);
            }
            
            // Si la respuesta está completa
            if (data.done) {
              res.write(`data: ${JSON.stringify({
                content: '',
                done: true,
                fullResponse: fullResponse.trim()
              })}\n\n`);
              res.end();
              return;
            }
          } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
          }
        }
      }
    });

    response.data.on('end', () => {
      if (!res.headersSent) {
        res.write(`data: ${JSON.stringify({
          content: '',
          done: true,
          fullResponse: fullResponse.trim()
        })}\n\n`);
        res.end();
      }
    });

    response.data.on('error', (error: Error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.write(`data: ${JSON.stringify({
          error: 'Error en el streaming',
          done: true
        })}\n\n`);
        res.end();
      }
    });

    // Manejar desconexión del cliente
    res.on('close', () => {
      console.log('Cliente desconectado');
      response.data.destroy();
    });

  } catch (error) {
    console.error('Error en streaming:', error);
    if (!res.headersSent) {
      res.write(`data: ${JSON.stringify({
        error: 'Ocurrió un error al generar la respuesta.',
        done: true
      })}\n\n`);
      res.end();
    }
  }
};