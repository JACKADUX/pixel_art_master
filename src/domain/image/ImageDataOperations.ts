export function cloneImageData(source: ImageData): ImageData {
  return {
    width: source.width,
    height: source.height,
    data: new Uint8ClampedArray(source.data),
    colorSpace: source.colorSpace,
  } as ImageData;
}

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 从源图像中裁剪出指定矩形区域，返回一张新的 ImageData。
 * 矩形会被夹紧到源图像范围内；越界或零尺寸时返回 null。
 */
export function cropImageData(source: ImageData, rect: PixelRect): ImageData | null {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const width = Math.min(Math.floor(rect.width), source.width - x);
  const height = Math.min(Math.floor(rect.height), source.height - y);
  if (width <= 0 || height <= 0) return null;

  const out = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row++) {
    const srcStart = ((y + row) * source.width + x) * 4;
    const srcEnd = srcStart + width * 4;
    out.set(source.data.subarray(srcStart, srcEnd), row * width * 4);
  }

  return {
    width,
    height,
    data: out,
    colorSpace: source.colorSpace,
  } as ImageData;
}
