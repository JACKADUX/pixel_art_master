import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import { createEmptyReferenceLayer } from "@/domain/layer/Layer";
import { referenceLayerCropKey } from "@/domain/layer/ReferenceLayerPalette";
import {
  clearReferenceLayerPixelCache,
  ensureReferenceLayerPixelCache,
  getReferenceLayerPixelCache,
} from "./ReferenceLayerPixelCache";

vi.mock("./ReferenceImageCache", () => ({
  getReferenceImage: vi.fn().mockResolvedValue({}),
  invalidateReferenceImage: vi.fn(),
}));

describe("ReferenceLayerPixelCache", () => {
  beforeEach(() => {
    clearReferenceLayerPixelCache();

    vi.stubGlobal("document", {
      createElement: vi.fn(() => {
        let cropX = 0;
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({
            imageSmoothingEnabled: false,
            drawImage: vi.fn((_image, sx: number) => {
              cropX = sx;
            }),
            getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => {
              const data = new Uint8ClampedArray(width * height * 4);
              const color = cropX === 0 ? [255, 0, 0, 255] : [0, 255, 0, 255];
              for (let i = 0; i < width * height; i += 1) {
                const offset = i * 4;
                data[offset] = color[0];
                data[offset + 1] = color[1];
                data[offset + 2] = color[2];
                data[offset + 3] = color[3];
              }
              return { data };
            }),
          })),
        };
      }),
    });
  });

  afterEach(() => {
    clearReferenceLayerPixelCache();
    vi.unstubAllGlobals();
  });

  it("looks up the active crop exactly and removes stale crop caches", async () => {
    const layer = createEmptyReferenceLayer("ref");
    layer.imageData = "base64";
    layer.imageSize = { width: 4, height: 4 };
    layer.crop = { x: 0, y: 0, width: 2, height: 2 };

    const firstCropKey = referenceLayerCropKey(layer.crop);
    await ensureReferenceLayerPixelCache(layer);
    expect(getReferenceLayerPixelCache(layer.id, firstCropKey)?.pixels[0]).toBe(
      rgba(255, 0, 0),
    );

    layer.crop = { x: 1, y: 0, width: 2, height: 2 };
    const secondCropKey = referenceLayerCropKey(layer.crop);
    await ensureReferenceLayerPixelCache(layer);

    expect(getReferenceLayerPixelCache(layer.id, firstCropKey)).toBeNull();
    expect(getReferenceLayerPixelCache(layer.id, secondCropKey)?.pixels[0]).toBe(
      rgba(0, 255, 0),
    );
  });
});
