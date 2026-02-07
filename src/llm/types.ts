import { BaseMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export interface ProviderConfig{
  name: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  [key: string]: any;
}

export interface ModelInfo{
    id: string;
    name: string;
    provider: string;
}

export interface LLMProvider{
  getName(): string;
  getConfig(): ProviderConfig;
  getModels(): ModelInfo[];
  getClient(): BaseChatModel;
  
  invoke(messages: BaseMessage[]): Promise<string>;

  invokeStream(messages: BaseMessage[]): AsyncIterable<string>;

  isAvailable(): Promise<boolean>;
}