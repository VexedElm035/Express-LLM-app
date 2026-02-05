import { LLMProvider, ModelInfo, ProviderConfig } from './types';
import { OllamaProvider } from './ollama/ollama-provider';
import { OpenAIProvider } from './openai/openai-provider';
import { GoogleProvider } from './google/google-provider';

export class LLMProviderRegistry{
  private providers: Map<string, LLMProvider> = new Map();
  private modelToProvider: Map<string, string> = new Map();

  register(provider: LLMProvider): void{
    const name = provider.getName();
    this.providers.set(name, provider);

    const models = provider.getModels();
    models.forEach((model: ModelInfo) => {
      this.modelToProvider.set(model.id, name);
    });
  } 

  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }

  getProviderByModel(modelId: string): LLMProvider | undefined {
    const providerName = this.modelToProvider.get(modelId);
    if (!providerName) {
      return undefined;
    }
    return this.providers.get(providerName);
  }

}

export const providerRegistry = new LLMProviderRegistry();

export async function initializeProviders(config: 
  {
    [key: string]: ProviderConfig;
  }): Promise<void>{
    if(config.ollama){
        try{
            const ollamaProvider = new OllamaProvider(config.ollama);
            const isOllamaAvailable = await ollamaProvider.isAvailable();
            console.log(isOllamaAvailable)
            if(isOllamaAvailable){
                providerRegistry.register(ollamaProvider);
                console.info(`OllamaProvider registrado con el modelo: ${config.ollama.model}`);
            } else {
                console.warn('OllamaProvider no está disponible. Verifique la configuración y el estado del servicio Ollama.');
            }
        } catch (error) {
            console.error('OllamaProvider initialization error:', error);
            return;
        }
    }

    if(config.openai && config.openai.apiKey){ 
      try{
          const openAIProvider = new OpenAIProvider(config.openai);
          providerRegistry.register(openAIProvider);
          console.info(`OpenAIProvider registrado con el modelo: ${config.openai.model}`);
      } catch (error) {
          console.error('OpenAIProvider initialization error:', error);
          return;
      }
    }

    if(config.google && config.google.apiKey){ 
      try{
          const googleProvider = new GoogleProvider(config.google);
          providerRegistry.register(googleProvider);
          console.info(`GoogleProvider registrado con el modelo: ${config.google.model}`);
      } catch (error) {
          console.error('GoogleProvider initialization error:', error);
          return;
      }
    }
}
