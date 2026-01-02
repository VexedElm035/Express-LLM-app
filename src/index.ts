import { initServer } from './app';

process.on('unhandledRejection', (razon, promesa) => {
  console.error('unhandledRejection...', { razon, promesa });
});

process.on('uncaughtException', (error) => {
  console.error('uncaughtException...', { mensaje: error.message, pila: error.stack });
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
  const mensajeError = error instanceof Error ? error.message : String(error);
  console.error('Fallo al iniciar la aplicación', { error: mensajeError });
  process.exit(1);
});
