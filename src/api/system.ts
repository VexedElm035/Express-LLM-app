import { Router, Request, Response } from 'express';
import { appConfig, obtenerMarcaTiempo } from '../core';
import { verificarSaludOllama } from '../agents';
import { HealthResponse, ModelsListResponse } from '../models';

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
      timestamp: obtenerMarcaTiempo(),
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
      timestamp: obtenerMarcaTiempo(),
      services: {},
    });
  }
});

systemRoutes.get('/', (_peticion: Request, respuesta: Response) => {
  respuesta.json({
    nombre: appConfig.app.nombre,
    version: appConfig.app.version,
    estado: 'en línea',
    
    endpoints: {
      salud: {
        metodo: 'GET',
        ruta: '/health',
      },
      models: {
        metodo: 'GET',
        ruta: '/v1/models',
      },
      chat: {
        metodo: 'POST',
        ruta: '/v1/chat/completions',
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
