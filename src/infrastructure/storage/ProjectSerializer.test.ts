import { describe, expect, it } from "vitest";
import { createEmptyDrawingLayer, createEmptyReferenceLayer } from "@/domain/layer/Layer";
import { createEmptyLuminancePalette } from "@/domain/luminancePalette/LuminancePalette";
import { Palette } from "@/domain/palette/Palette";
import { DEFAULT_GRID, type Project } from "@/domain/project/Project";
import { getActiveCanvas } from "@/domain/project/ProjectTestUtils";
import { DEFAULT_ORTHOGRAPHIC_VIEW } from "@/domain/viewport/OrthographicView";
import type { PixelCanvas } from "@/domain/pixelCanvas/PixelCanvas";
import { deserializeProject, serializeProject } from "./ProjectSerializer";

function buildPixelCanvas(scale: number, paletteVisible = true) {
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
    canvas: {
      id: "canvas-1",
      name: "画板 1",
      boardPosition: { x: 0, y: 0 },
      width: 4,
      height: 4,
      scaleFactor: 1,
      layers: [drawing],
      activeLayerId: drawing.id,
    } satisfies PixelCanvas,
    reference,
  };
}

function buildProject(scale: number, paletteVisible = true): Project {
  const { canvas, reference } = buildPixelCanvas(scale, paletteVisible);

  return {
    id: "project-1",
    name: "test",
    filePath: "test.json",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    board: {
      activeCanvasId: canvas.id,
      canvases: [canvas],
      totalCanvasCount: 1,
    },
    referenceLayers: [reference],
    activeReferenceLayerId: reference.id,
    palette: Palette.empty(),
    luminancePalette: createEmptyLuminancePalette(),
    notes: [],
    grid: { ...DEFAULT_GRID },
    orthographicView: { ...DEFAULT_ORTHOGRAPHIC_VIEW },
  };
}

function findReference(project: Project) {
  const layer = project.referenceLayers[0];
  if (!layer) throw new Error("reference layer missing");
  return layer;
}

function withActiveCanvasLayers(
  project: Project,
  layers: PixelCanvas["layers"],
  activeLayerId: string,
): Project {
  const canvas = getActiveCanvas(project);
  return {
    ...project,
    board: {
      ...project.board,
      canvases: project.board.canvases.map((entry) =>
        entry.id === canvas.id
          ? { ...entry, layers, activeLayerId }
          : entry,
      ),
    },
  };
}

describe("ProjectSerializer drawing layer v4", () => {
  it("round-trips drawing layer width height and position", () => {
    const drawing = {
      ...createEmptyDrawingLayer({ width: 4, height: 4 }),
      position: { x: 3, y: -1 },
    };
    const project = withActiveCanvasLayers(buildProject(1), [drawing], drawing.id);

    const json = serializeProject(project);
    const restored = deserializeProject(json, "test.json");
    const restoredDrawing = getActiveCanvas(restored).layers[0];

    expect(restoredDrawing?.type).toBe("drawing");
    if (restoredDrawing?.type !== "drawing") return;
    expect(restoredDrawing.width).toBe(4);
    expect(restoredDrawing.height).toBe(4);
    expect(restoredDrawing.position).toEqual({ x: 3, y: -1 });
  });
});

describe("ProjectSerializer reference layer", () => {
  it("round-trips reference layer scale and paletteVisible", () => {
    const project = buildProject(2.5, false);
    const json = serializeProject(project);
    const restored = deserializeProject(json, "test.json");
    const reference = findReference(restored);

    expect(reference.scale).toBe(2.5);
    expect(reference.paletteVisible).toBe(false);
    expect(reference.position).toEqual({ x: 1, y: 2 });
  });

  it("serializes as v7 with luminance palette", () => {
    const json = serializeProject(buildProject(1));
    const parsed = JSON.parse(json) as {
      version: number;
      referenceLayers: unknown[];
      luminancePalette: { groups: unknown[] };
    };
    expect(parsed.version).toBe(7);
    expect(parsed.referenceLayers).toHaveLength(1);
    expect(parsed.luminancePalette.groups).toEqual([]);
  });

  it("migrates v6 projects with empty luminance palette", () => {
    const v7Json = serializeProject(buildProject(1));
    const v6 = JSON.parse(v7Json) as Record<string, unknown>;
    v6.version = 6;
    delete v6.luminancePalette;

    const restored = deserializeProject(JSON.stringify(v6), "test.json");
    expect(restored.luminancePalette.groups).toEqual([]);
  });
});
