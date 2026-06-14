import type { ChatMessage } from "@/domain/llm/ChatMessage";
import type { LlmSettings } from "@/domain/llm/LlmSettings";

export interface ILlmClient {
  streamChat(
    settings: LlmSettings,
    messages: ChatMessage[],
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, unknown>;

  testConnection(settings: LlmSettings, signal?: AbortSignal): Promise<void>;
}
