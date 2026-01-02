/**
 * Endpoint de completación de chat
 * Maneja las peticiones de chat con el LLM
 */

import { Router, Request, Response } from 'express';
import { estimarTokens, appConfig } from '../core';
import { ChatCompletionRequestSchema, ChatCompletionResponse, ChatMessage} from '../models';
import { completarChatConStreaming } from '../agents';

export const chatRoutes = Router();

chatRoutes.post('/chat/completions', async (peticion: Request, respuesta: Response) => {
  try {
    // Validar la petición usando el esquema Zod
    const solicitudValidada = ChatCompletionRequestSchema.parse(peticion.body);

    const esStreaming = solicitudValidada.stream || false;

    console.info('Procesando solicitud de chat', {
      model: solicitudValidada.model,
      cantidadMensajes: solicitudValidada.messages.length,
      temperatura: solicitudValidada.temperature,
      streaming: esStreaming,
    });

    // Construir mensajes para el LLM
    const mensajes = solicitudValidada.messages;
    const mensajesLLM: ChatMessage[] = [];

    // Agregar prompt del sistema si no está presente
    const tienePromptSistema = mensajes.some((mensaje) => mensaje.role === 'system');
    if (!tienePromptSistema) {
      mensajesLLM.push({
        role: 'system',
        content: appConfig.system.promptInicial,
      });
    }

    // Agregar todos los mensajes
    mensajesLLM.push(...mensajes);

    // Manejar respuesta con streaming (tiempo real)
    if (esStreaming) {
      // Configurar headers para SSE (Server-Sent Events)
      respuesta.setHeader('Content-Type', 'text/event-stream');
      respuesta.setHeader('Cache-Control', 'no-cache');
      respuesta.setHeader('Connection', 'keep-alive');

      const idChat = `chatcmpl-${Date.now()}`;
      const creado = Math.floor(Date.now() / 1000);

      try {
        let contenidoCompleto = '';

        // Transmitir tokens desde Ollama en tiempo real
        for await (const fragmento of completarChatConStreaming(mensajesLLM, {
          model: solicitudValidada.model,
          temperatura: solicitudValidada.temperature,
          maxTokens: solicitudValidada.max_tokens,
        })) {
          contenidoCompleto += fragmento;

          // Enviar fragmento en formato OpenAI streaming
          const fragmentoStream = {
            id: idChat,
            object: 'chat.completion.chunk',
            created: creado,
            model: solicitudValidada.model,
            choices: [
              {
                index: 0,
                delta: {
                  content: fragmento,
                },
                finish_reason: null,
              },
            ],
          };

          respuesta.write(`data: ${JSON.stringify(fragmentoStream)}\n\n`);
        }

        // Enviar fragmento final con razón de finalización
        const fragmentoFinal = {
          id: idChat,
          object: 'chat.completion.chunk',
          created: creado,
          model: solicitudValidada.model,
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: 'stop',
            },
          ],
        };

        respuesta.write(`data: ${JSON.stringify(fragmentoFinal)}\n\n`);
        respuesta.write('data: [DONE]\n\n');
        respuesta.end();

        console.info('Streaming de chat completado', {
          longitudContenido: contenidoCompleto.length,
        });
      } catch (errorStreaming) {
        const mensajeError = errorStreaming instanceof Error ? errorStreaming.message : String(errorStreaming);
        console.error('Error durante streaming', { error: mensajeError });

        // Enviar error en formato streaming
        const fragmentoError = {
          id: idChat,
          object: 'chat.completion.chunk',
          created: creado,
          model: solicitudValidada.model,
          choices: [
            {
              index: 0,
              delta: {
                content: '\n\nLo siento, ocurrió un error al procesar tu consulta.',
              },
              finish_reason: 'error',
            },
          ],
        };

        respuesta.write(`data: ${JSON.stringify(fragmentoError)}\n\n`);
        respuesta.write('data: [DONE]\n\n');
        respuesta.end();
      }
    } else {
      let contenidoCompleto = '';

      // Recolectar todos los fragmentos
      for await (const fragmento of completarChatConStreaming(mensajesLLM, {
        model: solicitudValidada.model,
        temperatura: solicitudValidada.temperature,
        maxTokens: solicitudValidada.max_tokens,
      })) {
        contenidoCompleto += fragmento;
      }

      // Calcular uso de tokens (aproximación)
      const textoPrompt = mensajes.map((mensaje) => mensaje.content).join(' ');
      const tokensPrompt = estimarTokens(textoPrompt);
      const tokensRespuesta = estimarTokens(contenidoCompleto);

      // Construir respuesta compatible con OpenAI
      const respuestaChat: ChatCompletionResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: solicitudValidada.model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: contenidoCompleto,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: tokensPrompt,
          completion_tokens: tokensRespuesta,
          total_tokens: tokensPrompt + tokensRespuesta,
        },
      };

      respuesta.json(respuestaChat);

      console.info('Chat (no streaming) completado', {
        longitudContenido: contenidoCompleto.length,
      });
    }
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error('Error procesando chat', { error: mensajeError });

    // Solo enviar respuesta de error si los headers no se han enviado
    if (!respuesta.headersSent) {
      respuesta.status(400).json({
        error: 'Petición inválida',
        detalle: error instanceof Error ? error.message : 'Petición inválida',
      });
    }
  }
});
