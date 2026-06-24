import { createChatMessage, type ChatMessage } from "@/domain/llm/ChatMessage";
import { LlmError } from "@/domain/llm/LlmError";
import type { LlmSettings } from "@/domain/llm/LlmSettings";
import type { ILlmClient } from "../ports/ILlmClient";

const DEFAULT_VISION_PROMPT = "请识别并描述这张图片中的内容。";

/**
 * 识图用例：将图片（data URL）与可选提示词组装为单条多模态 user 消息，
 * 调用 LLM 的流式接口并逐块产出文本反馈。
 */
export async function* streamImageRecognition(
  client: ILlmClient,
  settings: LlmSettings,
  images: string[],
  prompt: string,
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  if (!images.length) {
    throw new LlmError("config", "请先上传图片");
  }

  const text = prompt.trim() || DEFAULT_VISION_PROMPT;
  const userMessage: ChatMessage = createChatMessage("user", text, { images });

  yield* client.streamChat(settings, [userMessage], signal);
}
