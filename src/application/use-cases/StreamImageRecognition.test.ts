import { describe, expect, it, vi } from "vitest";
import type { ILlmClient } from "@/application/ports/ILlmClient";
import { DEFAULT_LLM_SETTINGS } from "@/domain/llm/LlmSettings";
import { isLlmError } from "@/domain/llm/LlmError";
import { streamImageRecognition } from "./StreamImageRecognition";

const IMAGE = "data:image/png;base64,AAA";

function makeClient(chunks: string[]): ILlmClient {
  async function* mockStream() {
    for (const chunk of chunks) yield chunk;
  }
  return {
    streamChat: vi.fn().mockReturnValue(mockStream()),
    testConnection: vi.fn(),
  };
}

describe("streamImageRecognition", () => {
  it("builds a single multimodal user message and streams the result", async () => {
    const client = makeClient(["识别", "结果"]);

    const chunks: string[] = [];
    for await (const chunk of streamImageRecognition(
      client,
      DEFAULT_LLM_SETTINGS,
      [IMAGE],
      "这是什么？",
    )) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["识别", "结果"]);

    const [, messages] = (client.streamChat as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toBe("这是什么？");
    expect(messages[0].images).toEqual([IMAGE]);
  });

  it("falls back to a default prompt when none provided", async () => {
    const client = makeClient([]);

    // eslint-disable-next-line no-empty
    for await (const _ of streamImageRecognition(client, DEFAULT_LLM_SETTINGS, [IMAGE], "   ")) {
    }

    const [, messages] = (client.streamChat as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(messages[0].content.length).toBeGreaterThan(0);
  });

  it("throws a config error when no image is provided", async () => {
    const client = makeClient([]);

    await expect(async () => {
      for await (const _ of streamImageRecognition(client, DEFAULT_LLM_SETTINGS, [], "hi")) {
        void _;
      }
    }).rejects.toSatisfy((error: unknown) => isLlmError(error) && error.code === "config");

    expect(client.streamChat).not.toHaveBeenCalled();
  });
});
