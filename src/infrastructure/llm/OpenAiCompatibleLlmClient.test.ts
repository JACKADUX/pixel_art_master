import { describe, expect, it } from "vitest";
import { parseSseDataLine, parseSseStream } from "./sseParser";

describe("parseSseDataLine", () => {
  it("extracts delta content", () => {
    const line =
      'data: {"choices":[{"delta":{"content":"Hello"}}]}';
    expect(parseSseDataLine(line)).toBe("Hello");
  });

  it("returns null for DONE", () => {
    expect(parseSseDataLine("data: [DONE]")).toBeNull();
  });

  it("returns null for invalid json", () => {
    expect(parseSseDataLine("data: not-json")).toBeNull();
  });

  it("returns null for missing content", () => {
    expect(parseSseDataLine('data: {"choices":[{}]}')).toBeNull();
  });
});

describe("parseSseStream", () => {
  it("yields chunks from SSE stream", async () => {
    const payload = [
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n',
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n',
      "data: [DONE]\n",
    ].join("");

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(payload));
        controller.close();
      },
    });

    const chunks: string[] = [];
    for await (const chunk of parseSseStream(stream)) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(["Hel", "lo"]);
  });
});
