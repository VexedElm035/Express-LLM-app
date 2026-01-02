import { completarChat } from './ollama-client';
import { appConfig } from '../core';
import { ChatMessage } from '../models';

/**
 * Procesa una pregunta del usuario con el LLM
 * @param userQuery - La pregunta o texto del usuario
 * @param conversationHistory - Mensajes previos de la conversación (opcional)
 * @returns Objeto con el resultado y la response
 */
export async function procesarConsulta(
  userQuery: string,
  conversationHistory?: ChatMessage[]
): Promise<{
  success: boolean;
  response: string;
  error?: string;
}> {
  
  try {
    console.info('Procesando consulta del usuario', {
      longitudQuery: userQuery.length,
      longitudHistorial: conversationHistory?.length || 0,
    });

    // Construir el array de mensajes
    const mensajes: ChatMessage[] = [
      {
        role: 'system',
        content: appConfig.system.promptInicial,
      },
    ];

    // Agregar historial de conversación si existe
    if (conversationHistory && conversationHistory.length > 0) {
      mensajes.push(...conversationHistory);
    }

    // Agregar la consulta actual del usuario
    mensajes.push({
      role: 'user',
      content: userQuery,
    });

    // Obtener response del LLM
    const response = await completarChat(mensajes, {
      temperatura: appConfig.llm.temperatura,
      maxTokens: appConfig.llm.maxTokens,
    });

    console.info('Consulta procesada con éxito', {longitudresponse: response.length});

    return {
      success: true,
      response,
    };
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error('Error procesando consulta', { error: mensajeError });

    return {
      success: false,
      response: 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta de nuevo.',
      error: mensajeError,
    };
  }
}
