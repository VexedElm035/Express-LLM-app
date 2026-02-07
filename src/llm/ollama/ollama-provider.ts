import { ChatOllama } from "@langchain/ollama"
import { BaseMessage } from '@langchain/core/messages';
import { LLMProvider, ProviderConfig, ModelInfo } from "../types";

export class OllamaProvider implements LLMProvider{
  private client: ChatOllama;
  private config: ProviderConfig;

  constructor(config: ProviderConfig){
    this.config = config;
    this.client = new ChatOllama({
      baseUrl: config.baseUrl,
      model: config.model,
      temperature: config.temperature,
      numPredict: -1,
      numCtx: config.maxTokens,
      checkOrPullModel: true,
    });
  }

  getName(): string {
    return this.config.name;
  }

  getConfig(): ProviderConfig {
    return this.config;
  }

  getClient(): ChatOllama {
    return this.client;
  }
  
  getModels(): ModelInfo[] {
    return [{
      id: this.config.model,
      name: this.config.model,
      provider: this.getName(),
    }];
  }
  
  async invoke(messages: BaseMessage[]): Promise<any> {
    try{
      const response = await this.client.invoke(messages);
      return response;
    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : String(error);
      return `Error invoking Ollama LLM: ${mensajeError}`;
    }
  };
  
  async *invokeStream(messages: BaseMessage[]): AsyncGenerator<string> {
    try{
      for await (const chunk of await this.client.stream(messages)) {
        yield chunk.content.toString();
      }
    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : String(error);
      yield `Error invoking Ollama LLM: ${mensajeError}`;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = this.client.checkOrPullModel;
      return response;
    } catch (error) {
      console.error('OllamaProvider isAvailable error:', error);
      return false;
    }
  }
}