import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { appConfig } from '../core';
import { LLMProvider } from '../llm/types';

export interface ChatMessage{
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentResult{
  success: boolean;
  response: string;
  error?: string;
}

export class LLMAgent{
  private llmProvider: LLMProvider;

  constructor(llmProvider: LLMProvider){
    this.llmProvider = llmProvider;
  }

  private toBaseMessages(chatMessages: ChatMessage[]): BaseMessage[]{
    return chatMessages.map((msg) => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content);
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        default:
          throw new Error(`Rol de mensaje desconocido: ${msg.role}`);
      }
    });
  }

  async processQuery(
    userQuery: string,
    conversationHistory?: ChatMessage[]
  ): Promise<AgentResult> {
    try{
      const mensajes: ChatMessage[] = [
        {
          role: 'system',
          content: appConfig.system.promptInicial,
        },
      ];

      if (conversationHistory && conversationHistory.length > 0) {
        mensajes.push(...conversationHistory);
      }

      mensajes.push({
        role: 'user',
        content: userQuery,
      });

      const baseMessages = this.toBaseMessages(mensajes);
      const response = await this.llmProvider.invoke(baseMessages);
      return {
        success: true,
        response,
      };
    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : String(error);
      console.error('Error processing query in LLMAgent', { error: mensajeError });

      return {
        success: false,
        response: 'An error occurred while processing your query.',
        error: mensajeError,
      };
    }
  }

  async *processQueryStream(
    userQuery: string,
    conversationHistory?: ChatMessage[]
  ): AsyncGenerator<string> {
    try{
      const mensajes: ChatMessage[] = [
        {
          role: 'system',
          content: appConfig.system.promptInicial,
        },
      ];
      
      if (conversationHistory && conversationHistory.length > 0) {
        mensajes.push(...conversationHistory);
      }

      mensajes.push({
        role: 'user',
        content: userQuery,
      });

      const baseMessages = this.toBaseMessages(mensajes);
      
      for await (const chunk of this.llmProvider.invokeStream(baseMessages)) {
        yield chunk;
      }
    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : String(error);
      console.error('Error processing query stream in LLMAgent', { error: mensajeError });

      yield `An error occurred while processing your query: ${mensajeError}`;
    }
  }
}