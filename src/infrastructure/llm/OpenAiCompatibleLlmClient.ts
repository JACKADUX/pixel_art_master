import type { ILlmClient } from "@/application/ports/ILlmClient";
import { toApiMessages, type ChatMessage } from "@/domain/llm/ChatMessage";
import { LlmError } from "@/domain/llm/LlmError";
import { providerRequiresApiKey } from "@/domain/llm/LlmProvider";
import {
  resolveChatCompletionsUrl,
  validateLlmSettings,
  type LlmSettings,
} from "@/domain/llm/LlmSettings";
import { parseSseStream, readApiErrorMessage } from "./sseParser";

const APP_TITLE = "PixelArt Master";

function buildHeaders(settings: LlmSettings): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (providerRequiresApiKey(settings.provider) && settings.apiKey.trim()) {
    headers.Authorization = `Bearer ${settings.apiKey.trim()}`;
  }

  if (settings.provider === "openrouter") {
    headers["HTTP-Referer"] = "https://pixelart-master.local";
    headers["X-Title"] = APP_TITLE;
  }

  return headers;
}

function wrapFetchError(error: unknown): LlmError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new LlmError("aborted", "请求已取消");
  }
  if (error instanceof LlmError) return error;
  if (error instanceof TypeError) {
    return new LlmError("network", `网络错误：${error.message}`);
  }
  if (error instanceof Error) {
    return new LlmError("network", error.message);
  }
  return new LlmError("network", "未知网络错误");
}

export class OpenAiCompatibleLlmClient implements ILlmClient {
  async *streamChat(
    settings: LlmSettings,
    messages: ChatMessage[],
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, unknown> {
    validateLlmSettings(settings);

    const url = resolveChatCompletionsUrl(settings);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), settings.timeoutMs);

    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: buildHeaders(settings),
        body: JSON.stringify({
          model: settings.model,
          messages: toApiMessages(messages),
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await readApiErrorMessage(response);
        throw new LlmError("api", message, response.status);
      }

      if (!response.body) {
        throw new LlmError("parse", "响应体为空");
      }

      yield* parseSseStream(response.body, controller.signal);
    } catch (error) {
      throw wrapFetchError(error);
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
    }
  }

  async testConnection(settings: LlmSettings, signal?: AbortSignal): Promise<void> {
    validateLlmSettings(settings);

    const url = resolveChatCompletionsUrl(settings);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(settings.timeoutMs, 15_000));

    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: buildHeaders(settings),
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: "user", content: "ping" }],
          stream: false,
          max_tokens: 1,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await readApiErrorMessage(response);
        throw new LlmError("api", message, response.status);
      }
    } catch (error) {
      throw wrapFetchError(error);
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
    }
  }
}
