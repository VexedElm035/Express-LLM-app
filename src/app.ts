import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { appConfig } from './core';
import { systemRoutes, chatRoutes } from './api';

export function initApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    cors({
      origin: appConfig.api.origenCors,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Middleware para registrar todas las peticiones
  app.use((peticion: Request, _respuesta: Response, siguiente: NextFunction) => {
    console.info('peticion recibida', {
      metodo: peticion.method,
      ruta: peticion.path,
      consulta: peticion.query,
      ip: peticion.ip,
    });
    siguiente();
  });

  // Rutas
  app.use('/', systemRoutes);
  app.use('/v1', chatRoutes);

  // Manejador de errores 404
  app.use((_peticion: Request, respuesta: Response) => {
    respuesta.status(404).json({
      error: 'No encontrado',
      detalle: 'Ruta no existente',
    });
  });

  // Manejador global de errores
  app.use((error: Error, _peticion: Request, respuesta: Response, _siguiente: NextFunction) => {
    console.error('Error no manejado', { mensaje: error.message, pila: error.stack });

    respuesta.status(500).json({
      error: 'Error interno del servidor',
      detalle: appConfig.app.debug ? error.message : 'Ocurrió un error inesperado',
    });
  });

  return app;
}

export async function initServer(): Promise<void> {
  try {    
    console.log(`LLM configured: ${appConfig.llm.model}`);
    console.log(`Ollama url: ${appConfig.llm.urlBase}\n`);

    const app = initApp();

    app.listen(appConfig.api.puerto, appConfig.api.host, () => {
      const host = appConfig.api.host === '0.0.0.0' ? 'localhost' : appConfig.api.host;
      const url = `http://${host}:${appConfig.api.puerto}`;

      console.info(`Server listening in ${url}`);
      console.log('\nAvailable endpoints:');
      console.log(`${url}/`);
      console.log(`${url}/health`);
      console.log(`${url}/v1/models`);
      console.log(`${url}/v1/chat/completions\n`);
    });
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error('Fallo al iniciar la aplicación', { error: mensajeError });;
    process.exit(1);
  }
}
