export type ComfyErrorCode =
  | "config"
  | "network"
  | "api"
  | "aborted"
  | "parse"
  | "execution";

export class ComfyError extends Error {
  readonly code: ComfyErrorCode;
  readonly status?: number;

  constructor(code: ComfyErrorCode, message: string, status?: number) {
    super(message);
    this.name = "ComfyError";
    this.code = code;
    this.status = status;
  }
}

export function isComfyError(error: unknown): error is ComfyError {
  return error instanceof ComfyError;
}

export function comfyErrorMessage(error: unknown): string {
  if (isComfyError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "未知错误";
}
