/**
 * Endpoint de completación de chat
 * Maneja las peticiones de chat con el LLM
 */

import { Router, Request, Response } from 'express';
import { ChatCompletionRequestSchema, ChatCompletionResponse} from '../validators';
import { LLMAgent } from '../agents';
import { providerRegistry } from '../llm/registry';

export const chatRoutes = Router();

chatRoutes.post('/chat/completions', async (request: Request, response: Response) => {
  try {
    // Validar la petición usando el esquema Zod
    const requestValidated = ChatCompletionRequestSchema.parse(request.body);

    const esStreaming = requestValidated.stream;
    
    // Construir mensajes para el LLM
    const mensajes = requestValidated.messages;
    
    console.info('Solicitud de chat recibida:', {
      model: requestValidated.model,
      mensajes: mensajes,
      temperatura: requestValidated.temperature,
      streaming: esStreaming,
    });

    const provider= providerRegistry.getProviderByModel(requestValidated.model);

    if(!provider){
      throw new Error(`No se encontró un proveedor para el modelo: ${requestValidated.model}`);
    }

    const agent=new LLMAgent(provider);

    const idChat = `chatcmpl-${Date.now()}`;
    const creado = Math.floor(Date.now() / 1000);

    if(esStreaming){
      response.setHeader('Content-Type', 'text/event-stream');
      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Connection', 'keep-alive');

      try{
        const streamGenerator = agent.processQueryStream(
          requestValidated.messages[requestValidated.messages.length -1].content, 
          requestValidated.messages.slice(0, -1)
        );
        for await (const fragmento of streamGenerator) {
          response.write(`data: ${JSON.stringify({
            id: idChat,
            object: 'chat.completion.chunk',
            created: creado,
            model: requestValidated.model,
            choices: [
              {
                index: 0,
                delta: {
                  content: fragmento,
                },
                finish_reason: null,
              },
            ],
          })}\n\n`);
        }
        response.write('data: [DONE]\n\n');
        response.end();
      } catch (error){
        const mensajeError = error instanceof Error ? error.message : String(error);
        console.error('Error during streaming', { error: mensajeError });
        response.write(`data: ${JSON.stringify({
          id: idChat,
          object: 'chat.completion.chunk',
          created: creado,
          model: requestValidated.model,
          choices: [
            {
              index: 0,
              delta: {
                content: '\n\nLo siento, ocurrió un error al procesar tu consulta.',
              },
              finish_reason: 'error',
            },
          ],
        })}\n\n`);
        response.write('data: [DONE]\n\n');
        response.end();
      }
    } else {
      try{
        const result = await agent.processQuery(
          requestValidated.messages[requestValidated.messages.length -1].content, 
          requestValidated.messages.slice(0, -1)
        );
        if(!result.success){
          throw new Error(result.error || 'Error procesando la consulta');
        }
        const respuestaChat: ChatCompletionResponse = {
          id: idChat,
          object: 'chat.completion',
          created: creado,
          model: requestValidated.model,
          choices: [
            {
              index: result.response.response_metadata.index,
              message: {
                role: 'assistant',
                content: result.response.content.toString(),
                //content: result.response
              },
              finish_reason: result.response.response_metadata.finishReason,
            },
          ],
          usage: {
            //prompt_tokens: 0,
            //completion_tokens: 0,
            //total_tokens: 0,
            prompt_tokens: result.response.usage_metadata.input_tokens,
            completion_tokens: result.response.usage_metadata.output_tokens,
            total_tokens: result.response.usage_metadata.total_tokens,
          },
        };

        response.json(respuestaChat);
      } catch (error){
        throw error;
      }
    }
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error('Error procesando chat', { error: mensajeError });

    response.status(400).json({
      error: 'Petición inválida',
      detalle: error instanceof Error ? error.message : 'Petición inválida',
    });
  }
});
