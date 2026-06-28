import { collectImagesFromOutput, type ComfyImageRef } from "./ComfyResult";

export type ComfyProgressEvent =
  | { kind: "status"; queueRemaining: number }
  | { kind: "executionStart"; promptId: string }
  | { kind: "executing"; promptId: string; node: string | null }
  | { kind: "progress"; node: string | null; value: number; max: number }
  | { kind: "executed"; promptId: string; node: string; images: ComfyImageRef[] }
  | { kind: "error"; promptId?: string; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** 解析 ComfyUI WebSocket 文本消息（{type, data}）为领域进度事件 */
export function parseComfyWsMessage(raw: unknown): ComfyProgressEvent | null {
  let payload: unknown = raw;
  if (typeof raw === "string") {
    try {
      payload = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!isRecord(payload) || typeof payload.type !== "string") return null;
  const data = isRecord(payload.data) ? payload.data : {};

  switch (payload.type) {
    case "status": {
      const status = isRecord(data.status) ? data.status : {};
      const execInfo = isRecord(status.exec_info) ? status.exec_info : {};
      return { kind: "status", queueRemaining: asNumber(execInfo.queue_remaining) };
    }
    case "execution_start":
      return { kind: "executionStart", promptId: String(data.prompt_id ?? "") };
    case "executing":
      return {
        kind: "executing",
        promptId: String(data.prompt_id ?? ""),
        node: typeof data.node === "string" ? data.node : null,
      };
    case "progress":
      return {
        kind: "progress",
        node: typeof data.node === "string" ? data.node : null,
        value: asNumber(data.value),
        max: asNumber(data.max),
      };
    case "executed": {
      const node = String(data.node ?? "");
      return {
        kind: "executed",
        promptId: String(data.prompt_id ?? ""),
        node,
        images: collectImagesFromOutput(data.output, node),
      };
    }
    case "execution_error":
      return {
        kind: "error",
        promptId: data.prompt_id ? String(data.prompt_id) : undefined,
        message:
          typeof data.exception_message === "string"
            ? data.exception_message
            : "工作流执行出错",
      };
    default:
      return null;
  }
}

export type ComfyRunStatus = "idle" | "queued" | "running" | "completed" | "error";

export interface ComfyRunProgress {
  status: ComfyRunStatus;
  currentNode: string | null;
  value: number;
  max: number;
  percent: number;
  queueRemaining: number;
}

export const initialRunProgress: ComfyRunProgress = {
  status: "idle",
  currentNode: null,
  value: 0,
  max: 0,
  percent: 0,
  queueRemaining: 0,
};

function toPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}

/** 根据进度事件推进运行状态（纯函数） */
export function reduceProgress(
  state: ComfyRunProgress,
  event: ComfyProgressEvent,
): ComfyRunProgress {
  switch (event.kind) {
    case "status":
      return { ...state, queueRemaining: event.queueRemaining };
    case "executionStart":
      return { ...state, status: "running", currentNode: null };
    case "executing":
      if (event.node === null) {
        return { ...state, currentNode: null };
      }
      return { ...state, status: "running", currentNode: event.node };
    case "progress":
      return {
        ...state,
        status: "running",
        currentNode: event.node ?? state.currentNode,
        value: event.value,
        max: event.max,
        percent: toPercent(event.value, event.max),
      };
    case "executed":
      return { ...state };
    case "error":
      return { ...state, status: "error" };
    default:
      return state;
  }
}
