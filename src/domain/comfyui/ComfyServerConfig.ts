import { ComfyError } from "./ComfyError";

/** ComfyUI 服务器连接配置，address 形如 "127.0.0.1:8188"，可带协议前缀 */
export interface ComfyServerConfig {
  address: string;
}

export const DEFAULT_COMFY_ADDRESS = "127.0.0.1:8188";

export function createComfyServerConfig(address?: string): ComfyServerConfig {
  const normalized = normalizeComfyAddress(address ?? DEFAULT_COMFY_ADDRESS);
  return { address: normalized || DEFAULT_COMFY_ADDRESS };
}

/** 去除首尾空白与结尾斜杠，保留可选的协议前缀 */
export function normalizeComfyAddress(address: string): string {
  return address.trim().replace(/\/+$/, "");
}

function splitScheme(address: string): { scheme: "http" | "https"; host: string } {
  const trimmed = normalizeComfyAddress(address);
  const match = /^(https?):\/\/(.+)$/i.exec(trimmed);
  if (match) {
    return { scheme: match[1].toLowerCase() as "http" | "https", host: match[2] };
  }
  return { scheme: "http", host: trimmed };
}

export function resolveHttpBaseUrl(config: ComfyServerConfig): string {
  const { scheme, host } = splitScheme(config.address);
  if (!host) {
    throw new ComfyError("config", "请填写有效的 ComfyUI 服务器地址");
  }
  return `${scheme}://${host}`;
}

export function resolveWsUrl(config: ComfyServerConfig, clientId: string): string {
  const { scheme, host } = splitScheme(config.address);
  if (!host) {
    throw new ComfyError("config", "请填写有效的 ComfyUI 服务器地址");
  }
  const wsScheme = scheme === "https" ? "wss" : "ws";
  return `${wsScheme}://${host}/ws?clientId=${encodeURIComponent(clientId)}`;
}
