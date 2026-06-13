import type { Note } from "@/domain/note/Note";
import type {
  CropRect,
  DrawingLayer,
  Layer,
  LayerPosition,
  ReferenceGridConfig,
  ReferenceLayer,
} from "@/domain/layer/Layer";
import { createEmptyReferenceLayer } from "@/domain/layer/Layer";
import { Palette } from "@/domain/palette/Palette";
import type { GridConfig, Project } from "@/domain/project/Project";
import { DEFAULT_GRID } from "@/domain/project/Project";
import { normalizeLayerStack } from "@/domain/layer/LayerStack";
import { pixelsToPngBase64 } from "@/infrastructure/image/ImageDataCodec";

interface SerializedDrawingLayer {
  id: string;
  name: string;
  type: "drawing";
  visible: boolean;
  pixels: string;
}

interface SerializedReferenceLayer {
  id: string;
  name: string;
  type: "reference";
  visible: boolean;
  imageData: string | null;
  imageSize: { width: number; height: number } | null;
  crop: CropRect | null;
  position: LayerPosition;
  grid: ReferenceGridConfig;
}

type SerializedLayerV3 = SerializedDrawingLayer | SerializedReferenceLayer;

interface SerializedLayerV2 {
  id: string;
  name: string;
  type: "reference" | "drawing";
  visible: boolean;
  pixels: string;
}

interface SerializedCanvasV3 {
  width: number;
  height: number;
  scaleFactor: number;
  activeLayerId: string;
  activeReferenceLayerId?: string | null;
  layers: SerializedLayerV3[];
}

interface SerializedCanvasV2 {
  width: number;
  height: number;
  scaleFactor: number;
  activeLayerId: string;
  layers: SerializedLayerV2[];
}

interface SerializedCanvasV1 {
  width: number;
  height: number;
  scaleFactor: number;
  referenceLayer: string;
  drawingLayer: string;
}

interface SerializedProjectV3 {
  version: 3;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvas: SerializedCanvasV3;
  palette: { color: number; hex: string }[];
  notes: Note[];
  grid: GridConfig;
}

interface SerializedProjectV2 {
  version: 2;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvas: SerializedCanvasV2;
  palette: { color: number; hex: string }[];
  notes: Note[];
  grid: GridConfig;
}

interface SerializedProjectV1 {
  version: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvas: SerializedCanvasV1;
  palette: { color: number; hex: string }[];
  notes: Note[];
  grid: GridConfig;
}

function encodePixels(data: Uint32Array): string {
  const bytes = new Uint8Array(data.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodePixels(base64: string, expectedLength: number): Uint32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const arr = new Uint32Array(bytes.buffer);
  if (arr.length !== expectedLength) {
    throw new Error("Layer data size mismatch");
  }
  return arr;
}

function serializeLayerV3(layer: Layer, canvasWidth: number, canvasHeight: number): SerializedLayerV3 {
  if (layer.type === "drawing") {
    const pixelCount = canvasWidth * canvasHeight;
    if (layer.pixels.length !== pixelCount) {
      throw new Error(`Invalid layer size for layer ${layer.name}`);
    }
    return {
      id: layer.id,
      name: layer.name,
      type: "drawing",
      visible: layer.visible,
      pixels: encodePixels(layer.pixels),
    };
  }

  return {
    id: layer.id,
    name: layer.name,
    type: "reference",
    visible: layer.visible,
    imageData: layer.imageData,
    imageSize: layer.imageSize,
    crop: layer.crop,
    position: layer.position,
    grid: layer.grid,
  };
}

function migrateV2ReferenceLayer(
  sl: SerializedLayerV2,
  canvasWidth: number,
  canvasHeight: number,
  projectGrid: GridConfig,
): ReferenceLayer {
  const pixels = decodePixels(sl.pixels, canvasWidth * canvasHeight);
  const imageData = pixelsToPngBase64(pixels, canvasWidth, canvasHeight);
  const base = createEmptyReferenceLayer(sl.name);
  return {
    ...base,
    id: sl.id,
    name: sl.name,
    visible: sl.visible,
    imageData,
    imageSize: { width: canvasWidth, height: canvasHeight },
    crop: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
    position: { x: 0, y: 0 },
    grid: {
      primary: projectGrid.primary,
      secondary: projectGrid.secondary,
      visible: false,
    },
  };
}

function migrateV2Layers(
  v2Layers: SerializedLayerV2[],
  canvasWidth: number,
  canvasHeight: number,
  projectGrid: GridConfig,
): Layer[] {
  return v2Layers.map((sl) => {
    if (sl.type === "reference") {
      return migrateV2ReferenceLayer(sl, canvasWidth, canvasHeight, projectGrid);
    }
    const pixels = decodePixels(sl.pixels, canvasWidth * canvasHeight);
    const drawing: DrawingLayer = {
      id: sl.id,
      name: sl.name,
      type: "drawing",
      visible: sl.visible,
      pixels,
    };
    return drawing;
  });
}

function migrateV1ToV2Layers(data: SerializedProjectV1): SerializedLayerV2[] {
  const referenceId = crypto.randomUUID();
  const drawingId = crypto.randomUUID();
  return [
    {
      id: referenceId,
      name: "参考层",
      type: "reference",
      visible: true,
      pixels: data.canvas.referenceLayer,
    },
    {
      id: drawingId,
      name: "绘制层",
      type: "drawing",
      visible: true,
      pixels: data.canvas.drawingLayer,
    },
  ];
}

function resolveActiveLayerId(layers: Layer[], preferredId: string): string {
  const preferred = layers.find((layer) => layer.id === preferredId);
  if (preferred?.type === "drawing") return preferredId;
  return layers.find((layer) => layer.type === "drawing")?.id ?? preferredId;
}

function resolveActiveReferenceLayerId(
  layers: Layer[],
  preferredId: string | null | undefined,
  legacyActiveLayerId?: string,
): string | null {
  if (preferredId && layers.some((layer) => layer.id === preferredId && layer.type === "reference")) {
    return preferredId;
  }

  const legacy = layers.find((layer) => layer.id === legacyActiveLayerId);
  if (legacy?.type === "reference") return legacy.id;

  return layers.find((layer) => layer.type === "reference")?.id ?? null;
}

function buildProjectFromLayers(
  meta: {
    id: string;
    name: string;
    filePath: string;
    createdAt: string;
    updatedAt: string;
    canvasWidth: number;
    canvasHeight: number;
    scaleFactor: number;
    activeLayerId: string;
    activeReferenceLayerId?: string | null;
    palette: Palette;
    notes: Note[];
    grid: GridConfig;
  },
  layers: Layer[],
): Project {
  const normalizedLayers = normalizeLayerStack(layers);
  return {
    id: meta.id,
    name: meta.name,
    filePath: meta.filePath,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    canvas: {
      width: meta.canvasWidth,
      height: meta.canvasHeight,
      scaleFactor: meta.scaleFactor,
      layers: normalizedLayers,
      activeLayerId: resolveActiveLayerId(normalizedLayers, meta.activeLayerId),
      activeReferenceLayerId: resolveActiveReferenceLayerId(
        normalizedLayers,
        meta.activeReferenceLayerId,
        meta.activeLayerId,
      ),
    },
    palette: meta.palette,
    notes: meta.notes,
    grid: meta.grid,
  };
}

export function serializeProject(project: Project): string {
  const data: SerializedProjectV3 = {
    version: 3,
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    canvas: {
      width: project.canvas.width,
      height: project.canvas.height,
      scaleFactor: project.canvas.scaleFactor,
      activeLayerId: project.canvas.activeLayerId,
      activeReferenceLayerId: project.canvas.activeReferenceLayerId,
      layers: project.canvas.layers.map((l) =>
        serializeLayerV3(l, project.canvas.width, project.canvas.height),
      ),
    },
    palette: project.palette.toJSON(),
    notes: project.notes,
    grid: project.grid,
  };

  return JSON.stringify(data, null, 2);
}

export function deserializeProject(json: string, filePath: string): Project {
  const data = JSON.parse(json) as { version?: number };
  const grid = (data as SerializedProjectV3).grid ?? { ...DEFAULT_GRID };

  if (data.version === 3) {
    const v3 = data as SerializedProjectV3;
    const pixelCount = v3.canvas.width * v3.canvas.height;
    const layers: Layer[] = v3.canvas.layers.map((sl) => {
      if (sl.type === "drawing") {
        return {
          id: sl.id,
          name: sl.name,
          type: "drawing",
          visible: sl.visible,
          pixels: decodePixels(sl.pixels, pixelCount),
        };
      }
      const base = createEmptyReferenceLayer(sl.name);
      return {
        ...base,
        id: sl.id,
        name: sl.name,
        visible: sl.visible,
        imageData: sl.imageData,
        imageSize: sl.imageSize,
        crop: sl.crop,
        position: sl.position,
        grid: sl.grid,
      };
    });

    return buildProjectFromLayers(
      {
        id: v3.id,
        name: v3.name,
        filePath,
        createdAt: v3.createdAt,
        updatedAt: v3.updatedAt,
        canvasWidth: v3.canvas.width,
        canvasHeight: v3.canvas.height,
        scaleFactor: v3.canvas.scaleFactor,
        activeLayerId: v3.canvas.activeLayerId,
        activeReferenceLayerId: v3.canvas.activeReferenceLayerId,
        palette: Palette.fromJSON(v3.palette),
        notes: v3.notes ?? [],
        grid: grid,
      },
      layers,
    );
  }

  let v2Canvas: SerializedCanvasV2;
  let meta: Omit<Parameters<typeof buildProjectFromLayers>[0], "canvasWidth" | "canvasHeight" | "scaleFactor" | "activeLayerId" | "activeReferenceLayerId"> & {
    canvasWidth: number;
    canvasHeight: number;
    scaleFactor: number;
    activeLayerId: string;
    activeReferenceLayerId?: string | null;
  };

  if (!data.version || data.version === 1) {
    const v1 = data as SerializedProjectV1;
    v2Canvas = {
      width: v1.canvas.width,
      height: v1.canvas.height,
      scaleFactor: v1.canvas.scaleFactor,
      activeLayerId: "",
      layers: migrateV1ToV2Layers(v1),
    };
    meta = {
      id: v1.id,
      name: v1.name,
      filePath,
      createdAt: v1.createdAt,
      updatedAt: v1.updatedAt,
      canvasWidth: v1.canvas.width,
      canvasHeight: v1.canvas.height,
      scaleFactor: v1.canvas.scaleFactor,
      activeLayerId: v2Canvas.layers.find((l) => l.type === "drawing")!.id,
      palette: Palette.fromJSON(v1.palette),
      notes: v1.notes ?? [],
      grid: v1.grid ?? { ...DEFAULT_GRID },
    };
  } else if (data.version === 2) {
    const v2 = data as SerializedProjectV2;
    v2Canvas = v2.canvas;
    meta = {
      id: v2.id,
      name: v2.name,
      filePath,
      createdAt: v2.createdAt,
      updatedAt: v2.updatedAt,
      canvasWidth: v2.canvas.width,
      canvasHeight: v2.canvas.height,
      scaleFactor: v2.canvas.scaleFactor,
      activeLayerId: v2.canvas.activeLayerId,
      palette: Palette.fromJSON(v2.palette),
      notes: v2.notes ?? [],
      grid: v2.grid ?? { ...DEFAULT_GRID },
    };
  } else {
    throw new Error(`Unsupported project version: ${data.version}`);
  }

  const layers = migrateV2Layers(
    v2Canvas.layers,
    meta.canvasWidth,
    meta.canvasHeight,
    meta.grid,
  );

  return buildProjectFromLayers(meta, layers);
}
