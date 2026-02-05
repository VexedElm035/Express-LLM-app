import { config } from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno 
config();

const esquemaenv_variables = z.object({
  // Aplicación
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  APP_NAME: z.string().default('Express LLM App'),
  APP_VERSION: z.string().default('1.0.0'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Servidor
  API_HOST: z.string().default('localhost'),
  API_PORT: z.string().transform(Number).default('8000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:8080'),

  // LLM
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.1:8b-instruct-q4_K_M'),
  OLLAMA_TEMPERATURE: z.string().transform(Number).default('0.3'),
  OLLAMA_MAX_TOKENS: z.string().transform(Number).default('4096'),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('meta-llama/llama-3.3-70b-instruct:free'),
  OPENAI_TEMPERATURE: z.string().transform(Number).default('0.7'),
  OPENAI_MAX_TOKENS: z.string().transform(Number).default('2048'),

  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_MODEL: z.string().default('gemini-2.5-flash-lite'),
  GOOGLE_TEMPERATURE: z.string().transform(Number).default('0.3'),
  GOOGLE_MAX_TOKENS: z.string().transform(Number).default('4096'),

  // Prompt
  SYSTEM_PROMPT: z.string().default('Eres un asistente útil y amigable. Responde de manera clara y concisa.'),
});

const env_variables = esquemaenv_variables.parse(process.env);

export const appConfig = {
  // Configuración de la aplicación
  app: {
    name: env_variables.APP_NAME,
    version: env_variables.APP_VERSION,
    environment: env_variables.NODE_ENV,
  },

  // Configuración de logging
  logging: {
    logLevel: env_variables.LOG_LEVEL,
  },

  // Configuración del servidor API
  api: {
    host: env_variables.API_HOST,
    port: env_variables.API_PORT,
    corsOrigins: env_variables.CORS_ORIGINS.split(',').map((origen) => origen.trim()),
  },

  // Configuración del LLM (Modelo de Lenguaje)
  ollama: {
    urlBase: env_variables.OLLAMA_BASE_URL,
    model: env_variables.OLLAMA_MODEL,
    temperature: env_variables.OLLAMA_TEMPERATURE,
    maxTokens: env_variables.OLLAMA_MAX_TOKENS,
  },

  openai: {
    apiKey: env_variables.OPENAI_API_KEY,
    model: env_variables.OPENAI_MODEL,
    temperature: env_variables.OPENAI_TEMPERATURE,
    maxTokens: env_variables.OPENAI_MAX_TOKENS,
  },

  google: {
    apiKey: env_variables.GOOGLE_API_KEY,
    model: env_variables.GOOGLE_MODEL,
    temperature: env_variables.GOOGLE_TEMPERATURE,
    maxTokens: env_variables.GOOGLE_MAX_TOKENS,
  },

  llm: {
    urlBase: env_variables.OLLAMA_BASE_URL,
    model: env_variables.OLLAMA_MODEL,
    temperature: env_variables.OLLAMA_TEMPERATURE,
    maxTokens: env_variables.OLLAMA_MAX_TOKENS,
  },

  // Configuración del prompt
  system: {
    promptInicial: env_variables.SYSTEM_PROMPT,
  },
} as const;

export type appConfig = typeof appConfig;
