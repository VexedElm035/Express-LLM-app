/**
 * Data models and validation schemas using Zod
 * Simplified version - only chat completion schemas
 */

import { z } from 'zod';

/**
 * Chat message schema
 */
export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Chat completion request schema
 */
export const ChatCompletionRequestSchema = z.object({
  model: z.string().default('default'),
  messages: z.array(ChatMessageSchema).min(1, 'At least one message is required'),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
  stream: z.boolean().optional().default(false),
});

export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;

/**
 * Chat completion response schema
 */
export const ChatCompletionResponseSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion'),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      message: ChatMessageSchema,
      finish_reason: z.enum(['stop', 'length', 'error']),
    })
  ),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

export type ChatCompletionResponse = z.infer<typeof ChatCompletionResponseSchema>;

/**
 * Health check response schema
 */
export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  version: z.string(),
  timestamp: z.string(),
  services: z.record(
    z.object({
      status: z.enum(['up', 'down', 'unknown']),
      message: z.string().optional(),
    })
  ),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

/**
 * Models list response schema
 */
export const ModelsListResponseSchema = z.object({
  object: z.literal('list'),
  data: z.array(
    z.object({
      id: z.string(),
      object: z.literal('model'),
      created: z.number(),
      owned_by: z.string(),
    })
  ),
});

export type ModelsListResponse = z.infer<typeof ModelsListResponseSchema>;

/**
 * Error response schema
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  detail: z.string().optional(),
  code: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
