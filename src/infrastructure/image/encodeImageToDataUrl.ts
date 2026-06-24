export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export interface EncodedImage {
  /** data:<mime>;base64,<data> */
  dataUrl: string;
  name: string;
  size: number;
  type: string;
}

export class ImageEncodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageEncodeError";
  }
}

function isSupportedType(type: string): boolean {
  return (SUPPORTED_IMAGE_MIME_TYPES as readonly string[]).includes(type);
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ImageEncodeError("图片读取失败"));
    reader.onload = () => {
      const { result } = reader;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new ImageEncodeError("图片编码失败"));
      }
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * 将 File/Blob 转换为 data URL（base64），并校验类型与大小。
 * @param source 待编码的图片文件或二进制块
 * @param fallbackName 当来源没有文件名时使用的名称（如剪贴板粘贴）
 */
export async function encodeImageToDataUrl(
  source: File | Blob,
  fallbackName = "image",
): Promise<EncodedImage> {
  const type = source.type;
  if (!type || !isSupportedType(type)) {
    throw new ImageEncodeError("仅支持 JPEG / PNG / WebP / GIF 格式的图片");
  }
  if (source.size > MAX_IMAGE_BYTES) {
    throw new ImageEncodeError("图片过大，请使用不超过 10MB 的图片");
  }

  const dataUrl = await readAsDataUrl(source);
  const name = source instanceof File && source.name ? source.name : fallbackName;

  return { dataUrl, name, size: source.size, type };
}
