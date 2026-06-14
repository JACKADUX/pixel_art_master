import type { ILlmClient } from "@/application/ports/ILlmClient";
import { OpenAiCompatibleLlmClient } from "./OpenAiCompatibleLlmClient";

export function createLlmClient(): ILlmClient {
  return new OpenAiCompatibleLlmClient();
}

export const llmClient = createLlmClient();
