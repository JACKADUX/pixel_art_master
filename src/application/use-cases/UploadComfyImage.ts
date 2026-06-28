import type {
  IComfyUiClient,
  UploadImageResult,
} from "@/application/ports/IComfyUiClient";
import type { ComfyServerConfig } from "@/domain/comfyui/ComfyServerConfig";

/** 上传本地图片到 ComfyUI，返回可写入 LoadImage 节点的文件名引用 */
export async function uploadComfyImage(
  client: IComfyUiClient,
  config: ComfyServerConfig,
  bytes: Uint8Array,
  filename: string,
  signal?: AbortSignal,
): Promise<UploadImageResult> {
  return client.uploadImage(config, bytes, filename, signal);
}
