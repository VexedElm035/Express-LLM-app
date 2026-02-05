import { initServer } from './app';
import { appConfig } from './core/';

process.on('unhandledRejection', (reason, promise) => {
  console.error('unhandledRejection...', { reason, promise });
});

process.on('uncaughtException', (error) => {
  console.error('uncaughtException...', { message: error.message, stack: error.stack });
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.info('closing server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.info('closing server...');
  process.exit(0);
});

initServer().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('Failed to start the application', { error: errorMessage });
  process.exit(1);
});
