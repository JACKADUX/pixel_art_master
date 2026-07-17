import type { Note } from "@/domain/note/Note";
import type {
  CropRect,
  DrawingLayer,
  Layer,
  LayerPosition,
  ReferenceGridConfig,
  ReferenceLayer,
} from "@/domain/layer/Layer";
import { createEmptyReferenceLayer, DEFAULT_DRAWING_LAYER_OPACITY } from "@/domain/layer/Layer";
import { Palette } from "@/domain/palette/Palette";
import {
  createEmptyLuminancePalette,
  luminancePaletteFromJSON,
  luminancePaletteToJSON,
  type LuminancePaletteData,
  type SerializedLuminancePalette,
} from "@/domain/luminancePalette/LuminancePalette";
import type { GridConfig, Project } from "@/domain/project/Project";
import { DEFAULT_GRID } from "@/domain/project/Project";
import type { BoardPosition, PixelCanvas } from "@/domain/pixelCanvas/PixelCanvas";
import { DEFAULT_BOARD_POSITION } from "@/domain/pixelCanvas/PixelCanvas";
import {
  DEFAULT_ORTHOGRAPHIC_VIEW,
  type OrthographicViewConfig,
} from "@/domain/viewport/OrthographicView";
import { normalizeLayerStack } from "@/domain/layer/LayerStack";
import { isDrawingLayer, isReferenceLayer } from "@/domain/layer/LayerTypeGuards";
import { pixelsToPngBase64 } from "@/infrastructure/image/ImageDataCodec";

interface SerializedDrawingLayerV4 {
  id: string;
  name: string;
  type: "drawing";
  visible: boolean;
  opacity?: number;
  locked?: boolean;
  width: number;
  height: number;
  position: LayerPosition;
  pixels: string;
}

interface SerializedDrawingLayerV3 {
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
  scale?: number;
  paletteVisible?: boolean;
}

type SerializedLayerV4 = SerializedDrawingLayerV4 | SerializedReferenceLayer;
type SerializedLayerV3 = SerializedDrawingLayerV3 | SerializedReferenceLayer;

interface SerializedLayerV2 {
  id: string;
  name: string;
  type: "reference" | "drawing";
  visible: boolean;
  pixels: string;
}

interface SerializedCanvasV4 {
  width: number;
  height: number;
  scaleFactor: number;
  activeLayerId: string;
  activeReferenceLayerId?: string | null;
  layers: SerializedLayerV4[];
}

interface SerializedPixelCanvasV5 {
  id: string;
  name: string;
  boardPosition: BoardPosition;
  width: number;
  height: number;
  scaleFactor: number;
  activeLayerId: string;
  activeReferenceLayerId?: string | null;
  layers: SerializedLayerV4[];
}

interface SerializedPixelCanvasV6 {
  id: string;
  name: string;
  boardPosition: BoardPosition;
  width: number;
  height: number;
  scaleFactor: number;
  activeLayerId: string;
  layers: SerializedDrawingLayerV4[];
}

interface SerializedBoardV5 {
  activeCanvasId: string;
  canvases: SerializedPixelCanvasV5[];
}

interface SerializedBoardV6 {
  activeCanvasId: string;
  totalCanvasCount: number;
  canvases: SerializedPixelCanvasV6[];
}

interface SerializedProjectV4 {
  version: 4;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvas: SerializedCanvasV4;
  palette: { color: number; hex: string }[];
  notes: Note[];
  grid: GridConfig;
  orthographicView?: OrthographicViewConfig;
}

interface SerializedProjectV5 {
  version: 5;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  board: SerializedBoardV5;
  palette: { color: number; hex: string }[];
  notes: Note[];
  grid: GridConfig;
  orthographicView?: OrthographicViewConfig;
}

interface SerializedProjectV6 {
  version: 6;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  board: SerializedBoardV6;
  referenceLayers: SerializedReferenceLayer[];
  activeReferenceLayerId?: string | null;
  palette: { color: number; hex: string }[];
  notes: Note[];
  grid: GridConfig;
  orthographicView?: OrthographicViewConfig;
}

interface SerializedProjectV7 {
  version: 7;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  board: SerializedBoardV6;
  referenceLayers: SerializedReferenceLayer[];
  activeReferenceLayerId?: string | null;
  palette: { color: number; hex: string }[];
  luminancePalette?: SerializedLuminancePalette;
  notes: Note[];
  grid: GridConfig;
  orthographicView?: OrthographicViewConfig;
}

interface SerializedProjectV8 {
  version: 8;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  board: SerializedBoardV6;
  referenceLayers: SerializedReferenceLayer[];
  activeReferenceLayerId?: string | null;
  palette: { color: number; hex: string }[];
  luminancePalette?: SerializedLuminancePalette;
  notes: Note[];
  grid: GridConfig;
  orthographicView?: OrthographicViewConfig;
  quickExportPath?: string | null;
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

function serializeLayerV4(layer: Layer): SerializedLayerV4 {
  if (layer.type === "drawing") {
    return {
      id: layer.id,
      name: layer.name,
      type: "drawing",
      visible: layer.visible,
      opacity: layer.opacity !== DEFAULT_DRAWING_LAYER_OPACITY ? layer.opacity : undefined,
      locked: layer.locked ? true : undefined,
      width: layer.width,
      height: layer.height,
      position: layer.position,
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
    scale: layer.scale,
    paletteVisible: layer.paletteVisible,
  };
}

function deserializeDrawingLayerV4(sl: SerializedDrawingLayerV4): DrawingLayer {
  const pixelCount = sl.width * sl.height;
  return {
    id: sl.id,
    name: sl.name,
    type: "drawing",
    visible: sl.visible,
    opacity: sl.opacity ?? DEFAULT_DRAWING_LAYER_OPACITY,
    locked: sl.locked ?? false,
    width: sl.width,
    height: sl.height,
    position: sl.position,
    pixels: decodePixels(sl.pixels, pixelCount),
  };
}

function migrateV3DrawingLayer(
  sl: SerializedDrawingLayerV3,
  canvasWidth: number,
  canvasHeight: number,
): DrawingLayer {
  const pixelCount = canvasWidth * canvasHeight;
  return {
    id: sl.id,
    name: sl.name,
    type: "drawing",
    visible: sl.visible,
    opacity: DEFAULT_DRAWING_LAYER_OPACITY,
    locked: false,
    width: canvasWidth,
    height: canvasHeight,
    position: { x: 0, y: 0 },
    pixels: decodePixels(sl.pixels, pixelCount),
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
      opacity: DEFAULT_DRAWING_LAYER_OPACITY,
      locked: false,
      width: canvasWidth,
      height: canvasHeight,
      position: { x: 0, y: 0 },
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

function splitProjectLayers(layers: Layer[]): {
  referenceLayers: ReferenceLayer[];
  drawingLayers: Layer[];
} {
  const normalized = normalizeLayerStack(layers);
  return {
    referenceLayers: normalized.filter(isReferenceLayer),
    drawingLayers: normalized.filter(isDrawingLayer),
  };
}

function buildPixelCanvasFromLayers(
  meta: {
    id?: string;
    name?: string;
    boardPosition?: BoardPosition;
    canvasWidth: number;
    canvasHeight: number;
    scaleFactor: number;
    activeLayerId: string;
  },
  layers: Layer[],
): PixelCanvas {
  const { drawingLayers } = splitProjectLayers(layers);
  return {
    id: meta.id ?? crypto.randomUUID(),
    name: meta.name ?? "画板 1",
    boardPosition: meta.boardPosition ?? { ...DEFAULT_BOARD_POSITION },
    width: meta.canvasWidth,
    height: meta.canvasHeight,
    scaleFactor: meta.scaleFactor,
    layers: drawingLayers,
    activeLayerId: resolveActiveLayerId(drawingLayers, meta.activeLayerId),
  };
}

function buildProjectFromPixelCanvas(
  meta: {
    id: string;
    name: string;
    filePath: string;
    createdAt: string;
    updatedAt: string;
    palette: Palette;
    luminancePalette?: LuminancePaletteData;
    notes: Note[];
    grid: GridConfig;
    orthographicView: OrthographicViewConfig;
  },
  pixelCanvas: PixelCanvas,
  options?: {
    referenceLayers?: ReferenceLayer[];
    activeReferenceLayerId?: string | null;
    totalCanvasCount?: number;
  },
): Project {
  return {
    id: meta.id,
    name: meta.name,
    filePath: meta.filePath,
    quickExportPath: null,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    board: {
      canvases: [pixelCanvas],
      activeCanvasId: pixelCanvas.id,
      totalCanvasCount: options?.totalCanvasCount ?? 1,
    },
    referenceLayers: options?.referenceLayers ?? [],
    activeReferenceLayerId: options?.activeReferenceLayerId ?? null,
    palette: meta.palette,
    luminancePalette: meta.luminancePalette ?? createEmptyLuminancePalette(),
    notes: meta.notes,
    grid: meta.grid,
    orthographicView: meta.orthographicView,
  };
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
    orthographicView: OrthographicViewConfig;
  },
  layers: Layer[],
): Project {
  const { referenceLayers } = splitProjectLayers(layers);
  const pixelCanvas = buildPixelCanvasFromLayers(meta, layers);
  return buildProjectFromPixelCanvas(meta, pixelCanvas, {
    referenceLayers,
    activeReferenceLayerId: resolveActiveReferenceLayerId(
      referenceLayers,
      meta.activeReferenceLayerId,
      meta.activeLayerId,
    ),
  });
}

function serializePixelCanvasV6(canvas: PixelCanvas): SerializedPixelCanvasV6 {
  return {
    id: canvas.id,
    name: canvas.name,
    boardPosition: canvas.boardPosition,
    width: canvas.width,
    height: canvas.height,
    scaleFactor: canvas.scaleFactor,
    activeLayerId: canvas.activeLayerId,
    layers: canvas.layers
      .filter(isDrawingLayer)
      .map((layer) => serializeLayerV4(layer) as SerializedDrawingLayerV4),
  };
}

function deserializeReferenceLayer(sl: SerializedReferenceLayer): ReferenceLayer {
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
    scale: sl.scale ?? 1,
    paletteVisible: sl.paletteVisible ?? true,
  };
}

export function serializeProject(project: Project): string {
  const data: SerializedProjectV8 = {
    version: 8,
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    board: {
      activeCanvasId: project.board.activeCanvasId,
      totalCanvasCount: project.board.totalCanvasCount,
      canvases: project.board.canvases.map((canvas) => serializePixelCanvasV6(canvas)),
    },
    referenceLayers: project.referenceLayers.map((layer) =>
      serializeLayerV4(layer) as SerializedReferenceLayer,
    ),
    activeReferenceLayerId: project.activeReferenceLayerId,
    palette: project.palette.toJSON(),
    luminancePalette: luminancePaletteToJSON(project.luminancePalette),
    notes: project.notes,
    grid: project.grid,
    orthographicView: project.orthographicView,
    quickExportPath: project.quickExportPath,
  };

  return JSON.stringify(data, null, 2);
}

function deserializeV3Project(v3: SerializedProjectV3, filePath: string, grid: GridConfig): Project {
  const layers: Layer[] = v3.canvas.layers.map((sl) => {
    if (sl.type === "drawing") {
      return migrateV3DrawingLayer(sl, v3.canvas.width, v3.canvas.height);
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
      scale: sl.scale ?? 1,
      paletteVisible: sl.paletteVisible ?? true,
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
      grid,
      orthographicView: { ...DEFAULT_ORTHOGRAPHIC_VIEW },
    },
    layers,
  );
}

function deserializeV4Project(v4: SerializedProjectV4, filePath: string, grid: GridConfig): Project {
  const layers: Layer[] = v4.canvas.layers.map((sl) => {
    if (sl.type === "drawing") {
      return deserializeDrawingLayerV4(sl);
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
      scale: sl.scale ?? 1,
      paletteVisible: sl.paletteVisible ?? true,
    };
  });

  return buildProjectFromLayers(
    {
      id: v4.id,
      name: v4.name,
      filePath,
      createdAt: v4.createdAt,
      updatedAt: v4.updatedAt,
      canvasWidth: v4.canvas.width,
      canvasHeight: v4.canvas.height,
      scaleFactor: v4.canvas.scaleFactor,
      activeLayerId: v4.canvas.activeLayerId,
      activeReferenceLayerId: v4.canvas.activeReferenceLayerId,
      palette: Palette.fromJSON(v4.palette),
      notes: v4.notes ?? [],
      grid,
      orthographicView: v4.orthographicView ?? { ...DEFAULT_ORTHOGRAPHIC_VIEW },
    },
    layers,
  );
}

function deserializeV5Project(v5: SerializedProjectV5, filePath: string, grid: GridConfig): Project {
  const activeCanvasMeta =
    v5.board.canvases.find((canvas) => canvas.id === v5.board.activeCanvasId) ??
    v5.board.canvases[0];
  const referenceMap = new Map<string, ReferenceLayer>();

  for (const canvas of v5.board.canvases) {
    for (const layer of canvas.layers) {
      if (layer.type === "reference" && !referenceMap.has(layer.id)) {
        referenceMap.set(layer.id, deserializeReferenceLayer(layer));
      }
    }
  }

  const referenceLayers: ReferenceLayer[] = [];
  for (const layer of activeCanvasMeta?.layers ?? []) {
    if (layer.type === "reference" && referenceMap.has(layer.id)) {
      referenceLayers.push(referenceMap.get(layer.id)!);
      referenceMap.delete(layer.id);
    }
  }
  for (const layer of referenceMap.values()) {
    referenceLayers.push(layer);
  }

  const canvases: PixelCanvas[] = v5.board.canvases.map((sc) => {
    const layers: Layer[] = sc.layers.map((sl) =>
      sl.type === "drawing" ? deserializeDrawingLayerV4(sl) : deserializeReferenceLayer(sl),
    );

    return buildPixelCanvasFromLayers(
      {
        id: sc.id,
        name: sc.name,
        boardPosition: sc.boardPosition ?? { ...DEFAULT_BOARD_POSITION },
        canvasWidth: sc.width,
        canvasHeight: sc.height,
        scaleFactor: sc.scaleFactor,
        activeLayerId: sc.activeLayerId,
      },
      layers,
    );
  });

  const activeCanvasId = v5.board.activeCanvasId;
  const resolvedActiveId = canvases.some((c) => c.id === activeCanvasId)
    ? activeCanvasId
    : canvases[0]?.id ?? activeCanvasId;

  return {
    id: v5.id,
    name: v5.name,
    filePath,
    quickExportPath: null,
    createdAt: v5.createdAt,
    updatedAt: v5.updatedAt,
    board: {
      canvases,
      activeCanvasId: resolvedActiveId,
      totalCanvasCount: v5.board.canvases.length,
    },
    referenceLayers,
    activeReferenceLayerId: resolveActiveReferenceLayerId(
      referenceLayers,
      activeCanvasMeta?.activeReferenceLayerId,
    ),
    palette: Palette.fromJSON(v5.palette),
    luminancePalette: createEmptyLuminancePalette(),
    notes: v5.notes ?? [],
    grid,
    orthographicView: v5.orthographicView ?? { ...DEFAULT_ORTHOGRAPHIC_VIEW },
  };
}

function deserializeV6Project(v6: SerializedProjectV6, filePath: string, grid: GridConfig): Project {
  const canvases: PixelCanvas[] = v6.board.canvases.map((sc) =>
    buildPixelCanvasFromLayers(
      {
        id: sc.id,
        name: sc.name,
        boardPosition: sc.boardPosition ?? { ...DEFAULT_BOARD_POSITION },
        canvasWidth: sc.width,
        canvasHeight: sc.height,
        scaleFactor: sc.scaleFactor,
        activeLayerId: sc.activeLayerId,
      },
      sc.layers.map((layer) => deserializeDrawingLayerV4(layer)),
    ),
  );

  const activeCanvasId = v6.board.activeCanvasId;
  const resolvedActiveId = canvases.some((canvas) => canvas.id === activeCanvasId)
    ? activeCanvasId
    : canvases[0]?.id ?? activeCanvasId;

  const referenceLayers = v6.referenceLayers.map((layer) => deserializeReferenceLayer(layer));

  return {
    id: v6.id,
    name: v6.name,
    filePath,
    quickExportPath: null,
    createdAt: v6.createdAt,
    updatedAt: v6.updatedAt,
    board: {
      canvases,
      activeCanvasId: resolvedActiveId,
      totalCanvasCount: v6.board.totalCanvasCount ?? canvases.length,
    },
    referenceLayers,
    activeReferenceLayerId: resolveActiveReferenceLayerId(
      referenceLayers,
      v6.activeReferenceLayerId,
    ),
    palette: Palette.fromJSON(v6.palette),
    luminancePalette: createEmptyLuminancePalette(),
    notes: v6.notes ?? [],
    grid,
    orthographicView: v6.orthographicView ?? { ...DEFAULT_ORTHOGRAPHIC_VIEW },
  };
}

function deserializeV7Project(v7: SerializedProjectV7, filePath: string, grid: GridConfig): Project {
  const canvases: PixelCanvas[] = v7.board.canvases.map((sc) =>
    buildPixelCanvasFromLayers(
      {
        id: sc.id,
        name: sc.name,
        boardPosition: sc.boardPosition ?? { ...DEFAULT_BOARD_POSITION },
        canvasWidth: sc.width,
        canvasHeight: sc.height,
        scaleFactor: sc.scaleFactor,
        activeLayerId: sc.activeLayerId,
      },
      sc.layers.map((layer) => deserializeDrawingLayerV4(layer)),
    ),
  );

  const activeCanvasId = v7.board.activeCanvasId;
  const resolvedActiveId = canvases.some((canvas) => canvas.id === activeCanvasId)
    ? activeCanvasId
    : canvases[0]?.id ?? activeCanvasId;

  const referenceLayers = v7.referenceLayers.map((layer) => deserializeReferenceLayer(layer));

  return {
    id: v7.id,
    name: v7.name,
    filePath,
    quickExportPath: null,
    createdAt: v7.createdAt,
    updatedAt: v7.updatedAt,
    board: {
      canvases,
      activeCanvasId: resolvedActiveId,
      totalCanvasCount: v7.board.totalCanvasCount ?? canvases.length,
    },
    referenceLayers,
    activeReferenceLayerId: resolveActiveReferenceLayerId(
      referenceLayers,
      v7.activeReferenceLayerId,
    ),
    palette: Palette.fromJSON(v7.palette),
    luminancePalette: luminancePaletteFromJSON(v7.luminancePalette),
    notes: v7.notes ?? [],
    grid,
    orthographicView: v7.orthographicView ?? { ...DEFAULT_ORTHOGRAPHIC_VIEW },
  };
}

function deserializeV8Project(v8: SerializedProjectV8, filePath: string, grid: GridConfig): Project {
  const base = deserializeV7Project(
    {
      version: 7,
      id: v8.id,
      name: v8.name,
      createdAt: v8.createdAt,
      updatedAt: v8.updatedAt,
      board: v8.board,
      referenceLayers: v8.referenceLayers,
      activeReferenceLayerId: v8.activeReferenceLayerId,
      palette: v8.palette,
      luminancePalette: v8.luminancePalette,
      notes: v8.notes,
      grid: v8.grid,
      orthographicView: v8.orthographicView,
    },
    filePath,
    grid,
  );
  return {
    ...base,
    quickExportPath:
      typeof v8.quickExportPath === "string" ? v8.quickExportPath : null,
  };
}

export function deserializeProject(json: string, filePath: string): Project {
  const data = JSON.parse(json) as { version?: number };
  const grid = (data as SerializedProjectV4).grid ?? { ...DEFAULT_GRID };

  if (data.version === 8) {
    return deserializeV8Project(data as SerializedProjectV8, filePath, grid);
  }

  if (data.version === 7) {
    return deserializeV7Project(data as SerializedProjectV7, filePath, grid);
  }

  if (data.version === 6) {
    return deserializeV6Project(data as SerializedProjectV6, filePath, grid);
  }

  if (data.version === 5) {
    return deserializeV5Project(data as SerializedProjectV5, filePath, grid);
  }

  if (data.version === 4) {
    return deserializeV4Project(data as SerializedProjectV4, filePath, grid);
  }

  if (data.version === 3) {
    return deserializeV3Project(data as SerializedProjectV3, filePath, grid);
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
      orthographicView: { ...DEFAULT_ORTHOGRAPHIC_VIEW },
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
      orthographicView: { ...DEFAULT_ORTHOGRAPHIC_VIEW },
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
