import { describe, expect, it } from "vitest";
import { createEmptyDrawingLayer, createEmptyReferenceLayer } from "@/domain/layer/Layer";
import { isReferenceLayer } from "@/domain/layer/LayerTypeGuards";
import { Palette } from "@/domain/palette/Palette";
import { DEFAULT_GRID, type Project } from "@/domain/project/Project";
import { DEFAULT_ORTHOGRAPHIC_VIEW } from "@/domain/viewport/OrthographicView";
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
    orthographicView: { ...DEFAULT_ORTHOGRAPHIC_VIEW },
  };
}

function findReference(project: Project) {
  const layer = project.canvas.layers.find(isReferenceLayer);
  if (!layer) throw new Error("reference layer missing");
  return layer;
}

describe("ProjectSerializer drawing layer v4", () => {
  it("round-trips drawing layer width height and position", () => {
    const drawing = {
      ...createEmptyDrawingLayer({ width: 4, height: 4 }),
      position: { x: 3, y: -1 },
    };
    const project: Project = {
      ...buildProject(1),
      canvas: {
        ...buildProject(1).canvas,
        layers: [drawing],
        activeLayerId: drawing.id,
        activeReferenceLayerId: null,
      },
    };

    const json = serializeProject(project);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(4);

    const restored = deserializeProject(json, "test.json");
    const layer = restored.canvas.layers.find((entry) => entry.type === "drawing");
    expect(layer?.type).toBe("drawing");
    if (layer?.type === "drawing") {
      expect(layer.width).toBe(4);
      expect(layer.height).toBe(4);
      expect(layer.position).toEqual({ x: 3, y: -1 });
    }
  });

  it("round-trips drawing layer opacity and locked", () => {
    const drawing = {
      ...createEmptyDrawingLayer({ width: 4, height: 4 }),
      opacity: 128,
      locked: true,
    };
    const project: Project = {
      ...buildProject(1),
      canvas: {
        ...buildProject(1).canvas,
        layers: [drawing],
        activeLayerId: drawing.id,
        activeReferenceLayerId: null,
      },
    };

    const restored = deserializeProject(serializeProject(project), "test.json");
    const layer = restored.canvas.layers.find((entry) => entry.type === "drawing");
    if (layer?.type === "drawing") {
      expect(layer.opacity).toBe(128);
      expect(layer.locked).toBe(true);
    }
  });

  it("defaults missing opacity and locked for backward compatibility", () => {
    const json = serializeProject(buildProject(1));
    const parsed = JSON.parse(json);
    for (const layer of parsed.canvas.layers) {
      if (layer.type === "drawing") {
        delete layer.opacity;
        delete layer.locked;
      }
    }

    const restored = deserializeProject(JSON.stringify(parsed), "test.json");
    const layer = restored.canvas.layers.find((entry) => entry.type === "drawing");
    if (layer?.type === "drawing") {
      expect(layer.opacity).toBe(255);
      expect(layer.locked).toBe(false);
    }
  });

  it("migrates v3 drawing layers to v4 with canvas-aligned defaults", () => {
    const json = serializeProject(buildProject(1));
    const parsed = JSON.parse(json);
    parsed.version = 3;
    for (const layer of parsed.canvas.layers) {
      if (layer.type === "drawing") {
        delete layer.width;
        delete layer.height;
        delete layer.position;
      }
    }

    const restored = deserializeProject(JSON.stringify(parsed), "test.json");
    const layer = restored.canvas.layers.find((entry) => entry.type === "drawing");
    if (layer?.type === "drawing") {
      expect(layer.width).toBe(4);
      expect(layer.height).toBe(4);
      expect(layer.position).toEqual({ x: 0, y: 0 });
    }
  });
});

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

describe("ProjectSerializer orthographic view", () => {
  it("round-trips orthographic view settings", () => {
    const project = {
      ...buildProject(1),
      orthographicView: { enabled: true, cameraAngle: 63.5 },
    };
    const restored = deserializeProject(serializeProject(project), "test.json");
    expect(restored.orthographicView).toEqual({ enabled: true, cameraAngle: 63.5 });
  });

  it("defaults missing orthographic view for backward compatibility", () => {
    const json = serializeProject(buildProject(1));
    const parsed = JSON.parse(json);
    delete parsed.orthographicView;
    const restored = deserializeProject(JSON.stringify(parsed), "test.json");
    expect(restored.orthographicView).toEqual(DEFAULT_ORTHOGRAPHIC_VIEW);
  });
});
