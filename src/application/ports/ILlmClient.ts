import type { ChatMessage } from "@/domain/llm/ChatMessage";
import type { LlmSettings } from "@/domain/llm/LlmSettings";
import type { GenerationOptions } from "@/domain/llm/GenerationOptions";

export interface ILlmClient {
  streamChat(
    settings: LlmSettings,
    messages: ChatMessage[],
    options?: GenerationOptions,
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, unknown>;

  testConnection(settings: LlmSettings, signal?: AbortSignal): Promise<void>;
}
