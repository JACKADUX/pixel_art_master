import { describe, expect, it } from "vitest";
import { createEmptyDrawingLayer, createEmptyReferenceLayer } from "@/domain/layer/Layer";
import { isReferenceLayer } from "@/domain/layer/LayerTypeGuards";
import { Palette } from "@/domain/palette/Palette";
import { DEFAULT_GRID, type Project } from "@/domain/project/Project";
import { deserializeProject, serializeProject } from "./ProjectSerializer";

function buildProject(scale: number, paletteVisible = true): Project {
  const drawing = createEmptyDrawingLayer({ width: 4, height: 4 });
  const reference = {
    ...createEmptyReferenceLayer(),
    imageData: "data:image/png;base64,test",
    imageSize: { width: 4, height: 4 },
    crop: { x: 0, y: 0, width: 4, height: 4 },
    position: { x: 1, y: 2 },
    scale,
    paletteVisible,
  };

  return {
    id: "project-1",
    name: "test",
    filePath: "test.json",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    canvas: {
      width: 4,
      height: 4,
      scaleFactor: 1,
      layers: [reference, drawing],
      activeLayerId: drawing.id,
      activeReferenceLayerId: reference.id,
    },
    palette: Palette.empty(),
    notes: [],
    grid: { ...DEFAULT_GRID },
  };
}

function findReference(project: Project) {
  const layer = project.canvas.layers.find(isReferenceLayer);
  if (!layer) throw new Error("reference layer missing");
  return layer;
}

describe("ProjectSerializer reference scale", () => {
  it("round-trips the reference scale", () => {
    const json = serializeProject(buildProject(2.5));
    const restored = deserializeProject(json, "test.json");
    expect(findReference(restored).scale).toBe(2.5);
  });

  it("defaults missing scale to 1 for backward compatibility", () => {
    const json = serializeProject(buildProject(3));
    const parsed = JSON.parse(json);
    for (const layer of parsed.canvas.layers) {
      if (layer.type === "reference") delete layer.scale;
    }
    const restored = deserializeProject(JSON.stringify(parsed), "test.json");
    expect(findReference(restored).scale).toBe(1);
  });

  it("round-trips the palette visibility flag", () => {
    const json = serializeProject(buildProject(1, false));
    const restored = deserializeProject(json, "test.json");
    expect(findReference(restored).paletteVisible).toBe(false);
  });

  it("defaults missing palette visibility to true for backward compatibility", () => {
    const json = serializeProject(buildProject(1, false));
    const parsed = JSON.parse(json);
    for (const layer of parsed.canvas.layers) {
      if (layer.type === "reference") delete layer.paletteVisible;
    }
    const restored = deserializeProject(JSON.stringify(parsed), "test.json");
    expect(findReference(restored).paletteVisible).toBe(true);
  });
});
