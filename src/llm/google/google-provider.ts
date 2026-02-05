import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseMessage } from '@langchain/core/messages';
import { LLMProvider, ProviderConfig, ModelInfo } from "../types";

export class GoogleProvider implements LLMProvider{
  private client: ChatGoogleGenerativeAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig){
    this.config = config;
    this.client = new ChatGoogleGenerativeAI({
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      topK: undefined,
      topP: undefined,
    });
  }

  getName(): string {
    return this.config.name;
  }

  getConfig(): ProviderConfig {
    return this.config;
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
      if (!this.config.apiKey) {
        console.error('OpenAIProvider isAvailable error: API key is missing.');
        return false;
      } 
      return true;
    } catch (error) {
      console.error('OpenAIProvider isAvailable error:', error);
      return false;
    }
  }
}