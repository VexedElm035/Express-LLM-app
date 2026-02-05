import { BaseMessage } from '@langchain/core/messages';

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
  
  invoke(messages: BaseMessage[]): Promise<string>;

  invokeStream(messages: BaseMessage[]): AsyncIterable<string>;

  isAvailable(): Promise<boolean>;
}