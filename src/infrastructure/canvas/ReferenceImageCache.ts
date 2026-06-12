import { decodeBase64ToImage } from "@/infrastructure/image/ImageDataCodec";

interface CacheEntry {
  base64: string;
  image: HTMLImageElement;
}

const cache = new Map<string, CacheEntry>();

export async function getReferenceImage(
  layerId: string,
  base64: string,
): Promise<HTMLImageElement> {
  const existing = cache.get(layerId);
  if (existing && existing.base64 === base64) {
    return existing.image;
  }

  const image = await decodeBase64ToImage(base64);
  cache.set(layerId, { base64, image });
  return image;
}

export function invalidateReferenceImage(layerId: string): void {
  cache.delete(layerId);
}

export function clearReferenceImageCache(): void {
  cache.clear();
}
