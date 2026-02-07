import { BaseMessage, HumanMessage, AIMessage, SystemMessage, ContentBlock } from '@langchain/core/messages';
import { appConfig } from '../core';
import { LLMProvider } from '../llm/types';
import { createAgent } from 'langchain';

export interface ChatMessage{
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentResult{
  success: boolean;
  response: BaseMessage | string | (ContentBlock)[];
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
          role: 'user',
          content: userQuery,
        }
      ];
    
      const baseMessages = this.toBaseMessages(mensajes);
      const agent = createAgent({
        model: this.llmProvider.getClient(),
        tools: [],
        // checkpointer: memory,
        systemPrompt: appConfig.system.promptInicial,
      });

      const result = await agent.invoke({messages: baseMessages}, { configurable: { thread_id: "1" } });

      const lastMessage = result.messages[result.messages.length - 1];
      const responseText = lastMessage;

      return {
        success: true,
        response: responseText,
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