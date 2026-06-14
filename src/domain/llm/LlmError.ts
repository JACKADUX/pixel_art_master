export type LlmErrorCode =
  | "config"
  | "network"
  | "api"
  | "aborted"
  | "parse";

export class LlmError extends Error {
  readonly code: LlmErrorCode;
  readonly status?: number;

  constructor(code: LlmErrorCode, message: string, status?: number) {
    super(message);
    this.name = "LlmError";
    this.code = code;
    this.status = status;
  }
}

export function isLlmError(error: unknown): error is LlmError {
  return error instanceof LlmError;
}

export function llmErrorMessage(error: unknown): string {
  if (isLlmError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "未知错误";
}
