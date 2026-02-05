import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { appConfig } from './core';
import { systemRoutes, chatRoutes } from './routes';
import { initializeProviders } from './llm/registry';

export function initApp(): Application {
  
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    cors({
      origin: appConfig.api.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Middleware para registrar todas las peticiones
  app.use((request: Request, _response: Response, _next: NextFunction) => {
    console.info('request received', {
      method: request.method,
      path: request.path,
      query: request.query,
      ip: request.ip,
    });
    _next();
  });

  // Rutas
  app.use('/', systemRoutes);
  app.use('/v1', chatRoutes);

  // 404 error handler
  app.use((_request: Request, response: Response) => {
    response.status(404).json({
      error: 'Not found',
      detail: 'Non-existent route',
    });
  });

  // Global error handler
  app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
    console.error('Unhandled error', { message: error.message, stack: error.stack });

    response.status(500).json({
      error: 'Internal server error',
      detail: appConfig.logging.logLevel === 'debug' ? error.message : 'An unexpected error occurred',
    });
  });

  return app;
}

export async function initServer(): Promise<void> {
  try {    
    
    const app = initApp();
    
    await initializeProviders({
      ollama: {
        name: 'ollama',
        apiUrl: appConfig.ollama.urlBase,
        model: appConfig.ollama.model,
        temperature: appConfig.ollama.temperature,
      },
      openai: {
        name: 'openai',
        apiKey: appConfig.openai.apiKey,
        model: appConfig.openai.model,
        temperature: appConfig.openai.temperature,
      },
      google: {
        name: 'google',
        apiKey: appConfig.google.apiKey,
        model: appConfig.google.model,
        temperature: appConfig.google.temperature,
      },
    });

    app.listen(appConfig.api.port, appConfig.api.host, () => {
      const host = appConfig.api.host;
      const url = `http://${host}:${appConfig.api.port}`;
      console.info(`Server listening in ${url}`);
      console.log('\nAvailable endpoints:');
      console.log(`${url}/`);
      console.log(`${url}/health`);
      console.log(`${url}/v1/models`);
      console.log(`${url}/v1/chat/completions\n`);

    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to start the application', { error: errorMessage });
    process.exit(1);
  }
}
