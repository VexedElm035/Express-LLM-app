import { Ollama } from 'ollama';
import { appConfig } from '../core';

/**
 * Cliente de Ollama - Singleton
 * Crea una instancia del cliente para toda la aplicación
 */
let ollamaClient: Ollama | null = null;

/**
 * Obtiene o crea el cliente de Ollama
 * @returns Instancia del cliente de Ollama
 */
export function obtenerollamaClient(): Ollama {
  if (!ollamaClient) {
    ollamaClient = new Ollama({
      host: appConfig.llm.urlBase,
    });
    console.info('Cliente Ollama inicializado', {
      urlBase: appConfig.llm.urlBase
    });
  }
  return ollamaClient;
}

/**
 * Genera una respuesta usando Ollama
 * @param prompt - El texto o pregunta a enviar al model
 * @param options - options adicionales para la generación
 */
export async function generarRespuesta(
  prompt: string,
  options?: {
    model?: string;
    temperatura?: number;
    maxTokens?: number;
    stream?: boolean;
  }
): Promise<string> {
  const cliente = obtenerollamaClient();

  const model = options?.model || appConfig.llm.model;
  const temperatura = options?.temperatura ?? appConfig.llm.temperatura;
  const maxTokens = options?.maxTokens || appConfig.llm.maxTokens;

  console.info('Generating response with Ollama', {
    model,
    temperatura,
    maxTokens,
    longitudPrompt: prompt.length,
  });

  try {
    const respuesta = await cliente.generate({
      model: model,
      prompt,
      options: {
        temperature: temperatura,
        num_predict: maxTokens,
      },
      stream: false,
    });

    return respuesta.response;
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error('Error generando respuesta', {
      error: mensajeError,
      model,
    });
    throw new Error(`Error en generación de Ollama: ${mensajeError}`);
  }
}

/**
 * Completa un chat con historial de mensajes usando Ollama
 * @param mensajes - Array de mensajes del chat
 * @param options - options adicionales
 */
export async function completarChat(
  mensajes: Array<{ role: string; content: string }>,
  options?: {
    model?: string;
    temperatura?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const cliente = obtenerollamaClient();

  const model = options?.model || appConfig.llm.model;
  const temperatura = options?.temperatura ?? appConfig.llm.temperatura;

  console.info('Generating chat response with Ollama', {
    model,
    temperatura,
    cantidadMensajes: mensajes.length,
  });

  try {
    const respuesta = await cliente.chat({
      model: model,
      messages: mensajes.map((mensaje) => ({
        role: mensaje.role as 'system' | 'user' | 'assistant',
        content: mensaje.content,
      })),
      options: {
        temperature: temperatura,
        num_predict: options?.maxTokens || appConfig.llm.maxTokens,
      },
      stream: false,
    });

    return respuesta.message.content;
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error('Error generando respuesta de chat', {
      error: mensajeError,
      model,
    });
    throw new Error(`Error en chat de Ollama: ${mensajeError}`);
  }
}

/**
 * Completa un chat con streaming (respuesta en tiempo real)
 * @param mensajes - Array de mensajes del chat
 * @param options - options adicionales
 * @returns Generador asíncrono que produce fragmentos de la respuesta
 */
export async function* completarChatConStreaming(
  mensajes: Array<{ role: string; content: string }>,
  options?: {
    model?: string;
    temperatura?: number;
    maxTokens?: number;
  }
): AsyncIterable<string> {
  const cliente = obtenerollamaClient();

  const model = options?.model || appConfig.llm.model;
  const temperatura = options?.temperatura ?? appConfig.llm.temperatura;
    
  console.info('Generando respuesta de chat con streaming', {
    model,
    temperatura,
    cantidadMensajes: mensajes.length,
  });

  try {
    const flujo = await cliente.chat({
      model: model,
      messages: mensajes.map((mensaje) => ({
        role: mensaje.role as 'system' | 'user' | 'assistant',
        content: mensaje.content,
      })),
      options: {
        temperature: temperatura,
        num_predict: options?.maxTokens || appConfig.llm.maxTokens,
      },
      stream: true,
    });

    // Itera sobre cada fragmento de la respuesta
    for await (const fragmento of flujo) {
      if (fragmento.message?.content) {
        yield fragmento.message.content;
      }
    }
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error('Error generando respuesta con streaming', {
      error: mensajeError,
      model,
    });
    throw new Error(`Error en chat de Ollama (streaming): ${mensajeError}`);
  }
}

/**
 * Verifica si Ollama está disponible y el model está cargado
 */
export async function verificarSaludOllama(): Promise<{
  disponible: boolean;
  model: string;
  error?: string;
}> {
  try {
    const cliente = obtenerollamaClient();
    const models = await cliente.list();

    // Verifica si el model configurado existe
    const modelExiste = models.models.some(
      (modelItem: any) => modelItem.name === appConfig.llm.model
    );

    if (!modelExiste) {
      const modelsDisponibles = models.models.map((m: any) => m.name);
      console.warn('model configurado no encontrado en Ollama', {
        model: appConfig.llm.model,
        modelsDisponibles,
      });
      console.warn('model configurado no encontrado en Ollama', {
        model: appConfig.llm.model,
        modelsDisponibles,
      });
      
      return {
        disponible: false,
        model: appConfig.llm.model,
        error: `model ${appConfig.llm.model} no encontrado. models disponibles: ${modelsDisponibles.join(', ')}`,
      };
    }

    return {
      disponible: true,
      model: appConfig.llm.model,
    };
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error('Error verificando salud de Ollama', {
      error: mensajeError,
      urlBase: appConfig.llm.urlBase,
    });
    
    return {
      disponible: false,
      model: appConfig.llm.model,
      error: `No se pudo conectar a Ollama: ${mensajeError}`,
    };
  }
}

/**
 * Lista los models disponibles en Ollama
 */
export async function listarmodels(): Promise<string[]> {
  try {
    const cliente = obtenerollamaClient();
    const models = await cliente.list();
    return models.models.map((model: any) => model.name);
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error('Error listando models', { error: mensajeError });
    return [];
  }
}
