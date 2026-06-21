import { rgba } from "@/domain/canvas/PixelColor";
import type { CropRect, ReferenceLayer } from "@/domain/layer/Layer";
import { fullImageCrop } from "@/domain/layer/ReferenceLayerOperations";
import { referenceLayerCropKey } from "@/domain/layer/ReferenceLayerPalette";
import { getReferenceImage, invalidateReferenceImage } from "./ReferenceImageCache";

export interface ReferenceLayerPixelData {
  base64: string;
  cropKey: string;
  width: number;
  height: number;
  pixels: Uint32Array;
}

const FULL_PIXEL_CACHE_KEY = "full";

const cache = new Map<string, ReferenceLayerPixelData>();
const pending = new Map<string, Promise<ReferenceLayerPixelData | null>>();
const pendingTokens = new Map<string, object>();

function cacheStorageKey(layerId: string, cropKey: string): string {
  return `${layerId}::${cropKey}`;
}

function isCropCacheKey(key: string): boolean {
  return !key.endsWith(`::${FULL_PIXEL_CACHE_KEY}`);
}

export function removeStaleReferenceLayerCropCaches(
  layerId: string,
  activeCropKey: string,
): void {
  const activeStorageKey = cacheStorageKey(layerId, activeCropKey);
  for (const key of [...cache.keys()]) {
    if (key.startsWith(`${layerId}::`) && isCropCacheKey(key) && key !== activeStorageKey) {
      cache.delete(key);
    }
  }
  for (const key of [...pending.keys()]) {
    if (key.startsWith(`${layerId}::`) && isCropCacheKey(key) && key !== activeStorageKey) {
      pending.delete(key);
      pendingTokens.delete(key);
    }
  }
}

function readRegionPixels(
  image: HTMLImageElement,
  crop: CropRect,
  cropKey: string,
): ReferenceLayerPixelData {
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to read reference layer pixels");
  }

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  const imageData = ctx.getImageData(0, 0, crop.width, crop.height);
  const pixels = new Uint32Array(crop.width * crop.height);
  for (let i = 0; i < pixels.length; i += 1) {
    const offset = i * 4;
    pixels[i] = rgba(
      imageData.data[offset],
      imageData.data[offset + 1],
      imageData.data[offset + 2],
      imageData.data[offset + 3],
    );
  }

  return {
    base64: "",
    cropKey,
    width: crop.width,
    height: crop.height,
    pixels,
  };
}

async function ensurePixelCacheForCrop(
  layer: ReferenceLayer,
  crop: CropRect,
  cropKey: string,
): Promise<ReferenceLayerPixelData | null> {
  if (!layer.imageData) return null;

  const storageKey = cacheStorageKey(layer.id, cropKey);
  const existing = cache.get(storageKey);
  if (existing && existing.base64 === layer.imageData && existing.cropKey === cropKey) {
    return existing;
  }

  const pendingLoad = pending.get(storageKey);
  if (pendingLoad) {
    return pendingLoad;
  }

  const loadToken = {};
  const loadPromise = (async () => {
    const image = await getReferenceImage(layer.id, layer.imageData!);
    if (pendingTokens.get(storageKey) !== loadToken) {
      return null;
    }
    const pixelData = readRegionPixels(image, crop, cropKey);
    pixelData.base64 = layer.imageData!;
    cache.set(storageKey, pixelData);
    if (cropKey !== FULL_PIXEL_CACHE_KEY) {
      removeStaleReferenceLayerCropCaches(layer.id, cropKey);
    }
    if (pendingTokens.get(storageKey) === loadToken) {
      pending.delete(storageKey);
      pendingTokens.delete(storageKey);
    }
    return pixelData;
  })();

  pending.set(storageKey, loadPromise);
  pendingTokens.set(storageKey, loadToken);
  return loadPromise;
}

export function getReferenceLayerPixelCache(
  layerId: string,
  cropKey: string,
): ReferenceLayerPixelData | null {
  return cache.get(cacheStorageKey(layerId, cropKey)) ?? null;
}

export function invalidateReferenceLayerPixelCache(layerId: string): void {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(`${layerId}::`)) {
      cache.delete(key);
    }
  }
  for (const key of [...pending.keys()]) {
    if (key.startsWith(`${layerId}::`)) {
      pending.delete(key);
      pendingTokens.delete(key);
    }
  }
  invalidateReferenceImage(layerId);
}

export async function ensureReferenceLayerPixelCache(
  layer: ReferenceLayer,
): Promise<ReferenceLayerPixelData | null> {
  if (!layer.imageData || !layer.crop) return null;
  return ensurePixelCacheForCrop(layer, layer.crop, referenceLayerCropKey(layer.crop));
}

export async function ensureReferenceLayerFullPixelCache(
  layer: ReferenceLayer,
): Promise<ReferenceLayerPixelData | null> {
  if (!layer.imageData || !layer.imageSize) return null;
  const fullCrop = fullImageCrop(layer.imageSize);
  return ensurePixelCacheForCrop(layer, fullCrop, FULL_PIXEL_CACHE_KEY);
}

export function clearReferenceLayerPixelCache(): void {
  cache.clear();
  pending.clear();
  pendingTokens.clear();
}
