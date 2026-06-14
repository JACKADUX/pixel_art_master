import type { ChatMessage } from "@/domain/llm/ChatMessage";
import type { LlmSettings } from "@/domain/llm/LlmSettings";
import type { ILlmClient } from "../ports/ILlmClient";

export async function* streamChatCompletion(
  client: ILlmClient,
  settings: LlmSettings,
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  yield* client.streamChat(settings, messages, signal);
}
