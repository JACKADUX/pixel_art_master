import { describe, expect, it, vi } from "vitest";
import type { ILlmClient } from "@/application/ports/ILlmClient";
import { createChatMessage } from "@/domain/llm/ChatMessage";
import { DEFAULT_LLM_SETTINGS } from "@/domain/llm/LlmSettings";
import { streamChatCompletion } from "./StreamChatCompletion";

describe("streamChatCompletion", () => {
  it("delegates to ILlmClient.streamChat", async () => {
    async function* mockStream() {
      yield "a";
      yield "b";
    }

    const client: ILlmClient = {
      streamChat: vi.fn().mockReturnValue(mockStream()),
      testConnection: vi.fn(),
    };

    const messages = [createChatMessage("user", "hi")];
    const chunks: string[] = [];
    for await (const chunk of streamChatCompletion(client, DEFAULT_LLM_SETTINGS, messages)) {
      chunks.push(chunk);
    }

    expect(client.streamChat).toHaveBeenCalledWith(DEFAULT_LLM_SETTINGS, messages, undefined, undefined);
    expect(chunks).toEqual(["a", "b"]);
  });
});
