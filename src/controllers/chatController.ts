import { Request, Response, NextFunction } from 'express';
import { generateLLMResponse, generateLLMResponseStream } from '../services/llmService';
import { searchSimilar, hasDocuments } from '../services/vectorService';

export const test = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).json({
            content: 'Test route is working',
        });
    } catch (error) {
        next(error);
    }
} 

export const chatHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;

    // Verificar si hay documentos en la base vectorial antes de buscar
    const hasVectorData = await hasDocuments();
    
    if (hasVectorData) {
      // Si hay documentos, buscar información relevante
      const docResponse = await searchSimilar(content);
      
      if (docResponse !== "No se encontró información relevante.") {
        // Se encontró información relevante en la base vectorial
        // Enviar respuesta directa (no streaming para datos vectoriales)
        res.status(200).json({
          response: {
            content: docResponse.trim(),
            role: 'assistant',
          }
        });
        return;
      } else {
        // No se encontró información relevante, usar LLM con streaming
        await generateLLMResponseStream(content, res);
        return;
      }
    } else {
      // No hay documentos en la base vectorial, usar directamente el LLM con streaming
      console.log("Base de datos vectorial vacía, usando solo LLM");
      await generateLLMResponseStream(content, res);
      return;
    }
  } catch (error) {
    console.error('Error en chatHandler:', error);
    
    // En caso de error, intentar responder con el LLM como fallback
    try {
      const { content } = req.body;
      const fallbackResponse = await generateLLMResponse(content);
      
      res.status(200).json({
        response: {
          content: fallbackResponse.trim(),
          role: 'assistant',
        }
      });
    } catch (fallbackError) {
      next(fallbackError);
    }
  }
};

// Nuevo endpoint específico para streaming
export const chatStreamHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;

    // Verificar si hay documentos en la base vectorial antes de buscar
    const hasVectorData = await hasDocuments();
    
    if (hasVectorData) {
      // Si hay documentos, buscar información relevante
      const docResponse = await searchSimilar(content);
      
      if (docResponse !== "No se encontró información relevante.") {
        // Se encontró información relevante en la base vectorial
        // Simular streaming para mantener consistencia en la interfaz
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Enviar la respuesta completa de una vez
        res.write(`data: ${JSON.stringify({
          content: docResponse.trim(),
          done: true,
          fullResponse: docResponse.trim()
        })}\n\n`);
        res.end();
        return;
      }
    }

    // Si no hay información vectorial relevante, usar streaming del LLM
    console.log("Usando LLM con streaming");
    await generateLLMResponseStream(content, res);
    
  } catch (error) {
    console.error('Error en chatStreamHandler:', error);
    
    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });
      
      res.write(`data: ${JSON.stringify({
        error: 'Ocurrió un error al generar la respuesta.',
        done: true
      })}\n\n`);
      res.end();
    }
  }
};