import type {
  IComfyUiClient,
  QueuePromptResult,
  UploadImageResult,
} from "@/application/ports/IComfyUiClient";
import { ComfyError } from "@/domain/comfyui/ComfyError";
import {
  resolveHttpBaseUrl,
  resolveWsUrl,
  type ComfyServerConfig,
} from "@/domain/comfyui/ComfyServerConfig";
import {
  parseComfyWsMessage,
  type ComfyProgressEvent,
} from "@/domain/comfyui/ComfyProgress";
import type { ComfyImageRef } from "@/domain/comfyui/ComfyResult";
import type { ComfyApiWorkflow } from "@/domain/comfyui/ComfyWorkflow";

function wrapFetchError(error: unknown): ComfyError {
  if (error instanceof ComfyError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ComfyError("aborted", "请求已取消");
  }
  if (error instanceof TypeError) {
    return new ComfyError(
      "network",
      `无法连接 ComfyUI（${error.message}）。请确认服务器已启动，并以 --enable-cors-header 方式运行。`,
    );
  }
  if (error instanceof Error) {
    return new ComfyError("network", error.message);
  }
  return new ComfyError("network", "未知网络错误");
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      const error = record.error;
      if (typeof error === "string") return error;
      if (error && typeof error === "object") {
        const message = (error as Record<string, unknown>).message;
        if (typeof message === "string") return message;
      }
      if (record.node_errors) {
        return `节点参数错误：${JSON.stringify(record.node_errors)}`;
      }
    }
  } catch {
    // fall through
  }
  return `ComfyUI 请求失败（HTTP ${response.status}）`;
}

export class HttpComfyUiClient implements IComfyUiClient {
  async queuePrompt(
    config: ComfyServerConfig,
    workflow: ComfyApiWorkflow,
    clientId: string,
    signal?: AbortSignal,
  ): Promise<QueuePromptResult> {
    const url = `${resolveHttpBaseUrl(config)}/prompt`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: workflow, client_id: clientId }),
        signal,
      });

      if (!response.ok) {
        throw new ComfyError("api", await readErrorMessage(response), response.status);
      }

      const data: unknown = await response.json();
      const promptId =
        data && typeof data === "object"
          ? (data as Record<string, unknown>).prompt_id
          : undefined;
      if (typeof promptId !== "string") {
        throw new ComfyError("api", "ComfyUI 未返回 prompt_id");
      }
      return { promptId };
    } catch (error) {
      throw wrapFetchError(error);
    }
  }

  async openProgressStream(
    config: ComfyServerConfig,
    clientId: string,
    signal: AbortSignal,
  ): Promise<AsyncGenerator<ComfyProgressEvent, void, unknown>> {
    const url = resolveWsUrl(config, clientId);
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";

    const queue: ComfyProgressEvent[] = [];
    let wake: (() => void) | null = null;
    let closed = false;
    let socketError: ComfyError | null = null;

    const notify = () => {
      if (wake) {
        const resolve = wake;
        wake = null;
        resolve();
      }
    };

    // 在 open 之前就挂上消息处理，缓冲早到的事件，避免竞态丢失。
    ws.onmessage = (ev) => {
      if (typeof ev.data !== "string") return; // 忽略二进制预览帧
      const event = parseComfyWsMessage(ev.data);
      if (event) {
        queue.push(event);
        notify();
      }
    };
    ws.onerror = () => {
      socketError = new ComfyError("network", "WebSocket 连接错误，请检查 ComfyUI 地址");
      closed = true;
      notify();
    };
    ws.onclose = () => {
      closed = true;
      notify();
    };

    const onAbort = () => {
      closed = true;
      try {
        ws.close();
      } catch {
        // ignore
      }
      notify();
    };

    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener("abort", onAbort);
    }

    // 等待连接 OPEN（或失败），确保调用方在排队 prompt 前已建立连接。
    try {
      await new Promise<void>((resolve, reject) => {
        if (ws.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }
        if (signal.aborted) {
          reject(new ComfyError("aborted", "请求已取消"));
          return;
        }
        ws.addEventListener("open", () => resolve(), { once: true });
        ws.addEventListener(
          "error",
          () =>
            reject(
              new ComfyError(
                "network",
                "无法连接 ComfyUI WebSocket，请确认服务器地址与 --enable-cors-header 配置",
              ),
            ),
          { once: true },
        );
        signal.addEventListener("abort", () => reject(new ComfyError("aborted", "请求已取消")), {
          once: true,
        });
      });
    } catch (error) {
      signal.removeEventListener("abort", onAbort);
      try {
        ws.close();
      } catch {
        // ignore
      }
      throw error;
    }

    async function* drain(): AsyncGenerator<ComfyProgressEvent, void, unknown> {
      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift()!;
            continue;
          }
          if (closed) {
            if (socketError && !signal.aborted) throw socketError;
            return;
          }
          await new Promise<void>((resolve) => {
            wake = resolve;
          });
        }
      } finally {
        signal.removeEventListener("abort", onAbort);
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
    }

    return drain();
  }

  async fetchHistory(
    config: ComfyServerConfig,
    promptId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const url = `${resolveHttpBaseUrl(config)}/history/${encodeURIComponent(promptId)}`;
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new ComfyError("api", await readErrorMessage(response), response.status);
      }
      return await response.json();
    } catch (error) {
      throw wrapFetchError(error);
    }
  }

  async fetchImageBlob(
    config: ComfyServerConfig,
    ref: ComfyImageRef,
    signal?: AbortSignal,
  ): Promise<Blob> {
    const params = new URLSearchParams({
      filename: ref.filename,
      subfolder: ref.subfolder,
      type: ref.type,
    });
    const url = `${resolveHttpBaseUrl(config)}/view?${params.toString()}`;
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new ComfyError("api", await readErrorMessage(response), response.status);
      }
      return await response.blob();
    } catch (error) {
      throw wrapFetchError(error);
    }
  }

  async uploadImage(
    config: ComfyServerConfig,
    bytes: Uint8Array,
    filename: string,
    signal?: AbortSignal,
  ): Promise<UploadImageResult> {
    const url = `${resolveHttpBaseUrl(config)}/upload/image`;
    try {
      const form = new FormData();
      const blob = new Blob([bytes as BlobPart], { type: "application/octet-stream" });
      form.append("image", blob, filename);
      form.append("overwrite", "true");

      const response = await fetch(url, { method: "POST", body: form, signal });
      if (!response.ok) {
        throw new ComfyError("api", await readErrorMessage(response), response.status);
      }

      const data: unknown = await response.json();
      const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
      const name = typeof record.name === "string" ? record.name : filename;
      const subfolder = typeof record.subfolder === "string" ? record.subfolder : "";
      const type = typeof record.type === "string" ? record.type : "input";
      return { filename: name, subfolder, type };
    } catch (error) {
      throw wrapFetchError(error);
    }
  }

  async interrupt(config: ComfyServerConfig, signal?: AbortSignal): Promise<void> {
    const url = `${resolveHttpBaseUrl(config)}/interrupt`;
    try {
      const response = await fetch(url, { method: "POST", signal });
      if (!response.ok) {
        throw new ComfyError("api", await readErrorMessage(response), response.status);
      }
    } catch (error) {
      throw wrapFetchError(error);
    }
  }
}
