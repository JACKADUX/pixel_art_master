export function rgbaBufferToImageData(
  width: number,
  height: number,
  data: Uint8ClampedArray,
): ImageData {
  return new ImageData(new Uint8ClampedArray(data), width, height);
}

export function ensureImageData(imageData: ImageData): ImageData {
  if (typeof ImageData !== "undefined" && imageData instanceof ImageData) {
    return imageData;
  }
  return rgbaBufferToImageData(imageData.width, imageData.height, imageData.data);
}

export function encodeImageDataToPngBase64(imageData: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.putImageData(ensureImageData(imageData), 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Failed to encode image");
  return base64;
}

export function encodeRgbaToPngBase64(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): string {
  return encodeImageDataToPngBase64(new ImageData(rgba, width, height));
}

export function decodeBase64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/png;base64,${base64}`;
  });
}

export async function decodeBase64ToImageBitmap(
  base64: string,
): Promise<ImageBitmap> {
  const img = await decodeBase64ToImage(base64);
  return createImageBitmap(img);
}

export function pixelsToPngBase64(
  pixels: Uint32Array,
  width: number,
  height: number,
): string {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i++) {
    const color = pixels[i];
    const offset = i * 4;
    rgba[offset] = color & 0xff;
    rgba[offset + 1] = (color >> 8) & 0xff;
    rgba[offset + 2] = (color >> 16) & 0xff;
    rgba[offset + 3] = (color >> 24) & 0xff;
  }
  return encodeRgbaToPngBase64(rgba, width, height);
}
