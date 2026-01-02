import { config } from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno 
config();

const esquemaenv_variables = z.object({
  // Aplicación
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('Backend LLM Simple'),
  APP_VERSION: z.string().default('1.0.0'),
  DEBUG: z.string().transform((valor) => valor === 'true').default('false'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Servidor
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.string().transform(Number).default('8000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:8080'),

  // LLM
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.1:8b-instruct-q4_K_M'),
  OLLAMA_TEMPERATURE: z.string().transform(Number).default('0.7'),
  OLLAMA_MAX_TOKENS: z.string().transform(Number).default('2048'),

  // Prompt
  SYSTEM_PROMPT: z.string().default('Eres un asistente útil y amigable. Responde de manera clara y concisa.'),
});


const env_variables = esquemaenv_variables.parse(process.env);

export const appConfig = {
  // Configuración de la aplicación
  app: {
    nombre: env_variables.APP_NAME,
    version: env_variables.APP_VERSION,
    entorno: env_variables.NODE_ENV,
    debug: env_variables.DEBUG,
  },

  // Configuración de logging
  logging: {
    nivel: env_variables.LOG_LEVEL,
  },

  // Configuración del servidor API
  api: {
    host: env_variables.API_HOST,
    puerto: env_variables.API_PORT,
    origenCors: env_variables.CORS_ORIGINS.split(',').map((origen) => origen.trim()),
  },

  // Configuración del LLM (Modelo de Lenguaje)
  llm: {
    urlBase: env_variables.OLLAMA_BASE_URL,
    model: env_variables.OLLAMA_MODEL,
    temperatura: env_variables.OLLAMA_TEMPERATURE,
    maxTokens: env_variables.OLLAMA_MAX_TOKENS,
  },

  // Configuración del prompt
  system: {
    promptInicial: env_variables.SYSTEM_PROMPT,
  },
} as const;

export type appConfig = typeof appConfig;
