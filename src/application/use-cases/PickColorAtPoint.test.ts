import { describe, expect, it, vi } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import { createEmptyReferenceLayer } from "@/domain/layer/Layer";
import { createEmptyProject, withReferenceLayers } from "@/domain/project/Project";
import { getActiveCanvas } from "@/domain/project/ProjectTestUtils";
import {
  resolveColorAtCanvasPoint,
  resolveColorAtCanvasPointAsync,
} from "@/application/use-cases/PickColorAtPoint";
import type { ReferenceLayerPixelData } from "@/infrastructure/canvas/ReferenceLayerPixelCache";

function createReferenceProject(reference: ReturnType<typeof createEmptyReferenceLayer>) {
  const baseProject = createEmptyProject("test");
  return withReferenceLayers(baseProject, [reference]);
}

function setDrawingPixel(
  project: ReturnType<typeof createEmptyProject>,
  x: number,
  y: number,
  color: number,
) {
  const canvas = getActiveCanvas(project);
  const drawing = canvas.layers.find((layer) => layer.type === "drawing");
  if (!drawing || drawing.type !== "drawing") return;
  drawing.pixels[y * canvas.width + x] = color;
}

describe("resolveColorAtCanvasPoint", () => {
  it("does not sample a stale reference cache from a different crop", () => {
    const reference = createEmptyReferenceLayer("ref");
    reference.imageData = "base64";
    reference.imageSize = { width: 4, height: 4 };
    reference.crop = { x: 1, y: 0, width: 2, height: 2 };
    reference.position = { x: 0, y: 0 };

    const project = createReferenceProject(reference);
    const fallbackColor = rgba(0, 0, 255);
    setDrawingPixel(project, 1, 0, fallbackColor);

    const staleCache: ReferenceLayerPixelData = {
      base64: "base64",
      cropKey: "0,0,2,2",
      width: 2,
      height: 2,
      pixels: new Uint32Array([
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
        rgba(255, 0, 0),
      ]),
    };

    const color = resolveColorAtCanvasPoint(project, { x: 1, y: 0 }, () => staleCache);

    expect(color).toBe(fallbackColor);
  });

  it("maps the canvas point back to source pixels when the reference layer is scaled", () => {
    const reference = createEmptyReferenceLayer("ref");
    reference.imageData = "base64";
    reference.imageSize = { width: 2, height: 2 };
    reference.crop = { x: 0, y: 0, width: 2, height: 2 };
    reference.position = { x: 0, y: 0 };
    reference.scale = 2;

    const project = createReferenceProject(reference);
    const topLeft = rgba(255, 0, 0);
    const topRight = rgba(0, 255, 0);
    const cache: ReferenceLayerPixelData = {
      base64: "base64",
      cropKey: "0,0,2,2",
      width: 2,
      height: 2,
      pixels: new Uint32Array([
        topLeft,
        topRight,
        rgba(0, 0, 255),
        rgba(255, 255, 0),
      ]),
    };

    expect(resolveColorAtCanvasPoint(project, { x: 1, y: 0 }, () => cache)).toBe(topLeft);
    expect(resolveColorAtCanvasPoint(project, { x: 2, y: 0 }, () => cache)).toBe(topRight);
  });

  it("loads the reference cache before falling back when resolving asynchronously", async () => {
    const reference = createEmptyReferenceLayer("ref");
    reference.imageData = "base64";
    reference.imageSize = { width: 2, height: 2 };
    reference.crop = { x: 0, y: 0, width: 2, height: 2 };
    reference.position = { x: 5, y: 5 };

    const project = createReferenceProject(reference);
    const expectedColor = rgba(0, 255, 0);
    const loadedCache: ReferenceLayerPixelData = {
      base64: "base64",
      cropKey: "0,0,2,2",
      width: 2,
      height: 2,
      pixels: new Uint32Array([
        rgba(255, 0, 0),
        expectedColor,
        rgba(0, 0, 255),
        rgba(255, 255, 0),
      ]),
    };

    const getPixelCache = vi.fn(() => null);
    const ensurePixelCache = vi.fn().mockResolvedValue(loadedCache);

    const color = await resolveColorAtCanvasPointAsync(
      project,
      { x: 6, y: 5 },
      getPixelCache,
      ensurePixelCache,
    );

    expect(color).toBe(expectedColor);
    expect(ensurePixelCache).toHaveBeenCalledWith(reference);
  });
});
