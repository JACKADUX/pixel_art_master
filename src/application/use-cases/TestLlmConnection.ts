import { llmErrorMessage } from "@/domain/llm/LlmError";
import type { LlmSettings } from "@/domain/llm/LlmSettings";
import type { ILlmClient } from "../ports/ILlmClient";

export async function testLlmConnection(
  client: ILlmClient,
  settings: LlmSettings,
  signal?: AbortSignal,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await client.testConnection(settings, signal);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: llmErrorMessage(error) };
  }
}
