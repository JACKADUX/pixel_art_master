import type { ComfyServerConfig } from "@/domain/comfyui/ComfyServerConfig";
import type { ComfyApiWorkflow } from "@/domain/comfyui/ComfyWorkflow";
import type { ComfyProgressEvent } from "@/domain/comfyui/ComfyProgress";
import type { ComfyImageRef } from "@/domain/comfyui/ComfyResult";

export interface QueuePromptResult {
  promptId: string;
}

/** /upload/image 返回的图片引用，可直接写入 LoadImage 节点输入 */
export interface UploadImageResult {
  filename: string;
  subfolder: string;
  type: string;
}

/** ComfyUI 后端访问端口（基础设施实现 fetch + WebSocket） */
export interface IComfyUiClient {
  /** 提交工作流到 /prompt 队列 */
  queuePrompt(
    config: ComfyServerConfig,
    workflow: ComfyApiWorkflow,
    clientId: string,
    signal?: AbortSignal,
  ): Promise<QueuePromptResult>;

  /**
   * 建立 WebSocket 进度流。返回的 Promise 在连接进入 OPEN 后才 resolve，
   * 以确保调用方可以在排队 prompt 前完成连接，避免错过早期事件。
   * 生成器逐条产出领域进度事件，直到连接关闭或被中断。
   */
  openProgressStream(
    config: ComfyServerConfig,
    clientId: string,
    signal: AbortSignal,
  ): Promise<AsyncGenerator<ComfyProgressEvent, void, unknown>>;

  /** 拉取指定 prompt 的执行历史（用于收集结果图） */
  fetchHistory(
    config: ComfyServerConfig,
    promptId: string,
    signal?: AbortSignal,
  ): Promise<unknown>;

  /** 通过 /view 拉取结果图二进制 */
  fetchImageBlob(
    config: ComfyServerConfig,
    ref: ComfyImageRef,
    signal?: AbortSignal,
  ): Promise<Blob>;

  /** 中断当前正在执行的工作流 */
  interrupt(config: ComfyServerConfig, signal?: AbortSignal): Promise<void>;

  /** 上传图片到 /upload/image，返回服务器侧文件名引用（供应用层图片组件使用） */
  uploadImage(
    config: ComfyServerConfig,
    bytes: Uint8Array,
    filename: string,
    signal?: AbortSignal,
  ): Promise<UploadImageResult>;
}
