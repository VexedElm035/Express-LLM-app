import { Router, Request, Response } from 'express';
import { appConfig } from '../core';
import { verificarSaludOllama } from '../agents';
import { HealthResponse, ModelsListResponse } from '../validators';

export const systemRoutes = Router();

// Guardar el tiempo de inicio del servidor
const tiempoInicio = Date.now();

/**
 * GET /health
 * Endpoint para verificar el estado del servidor
 */
systemRoutes.get('/health', async (_peticion: Request, respuesta: Response) => {
  try {
    // Verificar el estado de Ollama
    const saludOllama = await verificarSaludOllama();

    const respuestaSalud: HealthResponse = {
      status: saludOllama.disponible ? 'healthy' : 'degraded',
      version: appConfig.app.version,
      timestamp: new Date().toISOString(),
      services: {
        ollama: {
          status: saludOllama.disponible ? 'up' : 'down',
          message: saludOllama.error || `model: ${saludOllama.model}`,
        },
      },
    };

    respuesta.json(respuestaSalud);
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error('Error verificando salud del sistema', { error: mensajeError });

    respuesta.status(500).json({
      status: 'unhealthy',
      version: appConfig.app.version,
      timestamp: new Date().toISOString(),
      services: {},
    });
  }
});

systemRoutes.get('/', (_peticion: Request, respuesta: Response) => {
  respuesta.json({
    nombre: appConfig.app.name,
    version: appConfig.app.version,
    status: 'online',
    
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
      },
      models: {
        method: 'GET',
        path: '/v1/models',
      },
      chat: {
        method: 'POST',
        path: '/v1/chat/completions',
      },
    },
  });
});

systemRoutes.get('/v1/models', (_peticion: Request, respuesta: Response) => {
  // Retorna información del model (compatible con API de OpenAI)
  // Esto evita hacer una llamada de red a Ollama en cada petición
  const respuestamodels: ModelsListResponse = {
    object: 'list',
    data: [
      {
        id: appConfig.llm.model,
        object: 'model' as const,
        created: tiempoInicio,
        owned_by: 'ollama',
      },
    ],
  };

  respuesta.json(respuestamodels);
});