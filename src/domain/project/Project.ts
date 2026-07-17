import type { PixelGrid } from "../canvas/PixelGrid";
import { compositeDrawingLayers } from "../layer/LayerCompositor";
import {
  createEmptyDrawingLayer,
  createEmptyReferenceLayer,
  type Layer,
} from "../layer/Layer";
import {
  expandDrawingLayersForCanvasGrow,
} from "../layer/DrawingLayerOperations";
import {
  addDrawingLayer as addDrawingLayerOp,
  getLayerGrid,
} from "../layer/LayerOperations";
import { createCanvasSize, type CanvasSize } from "../canvas/CanvasSize";
import { DEFAULT_CANVAS_SIZE } from "../canvas/CanvasSizePreset";
import { isDrawingLayer } from "../layer/LayerTypeGuards";
import type { ReferenceLayer } from "../layer/Layer";
import {
  setReferenceImage,
} from "../layer/ReferenceLayerOperations";
import type { Note } from "../note/Note";
import {
  createEmptyLuminancePalette,
  type LuminancePaletteData,
} from "../luminancePalette/LuminancePalette";
import { Palette } from "../palette/Palette";
import {
  DEFAULT_ORTHOGRAPHIC_VIEW,
  type OrthographicViewConfig,
} from "../viewport/OrthographicView";
import {
  createCanvasBoard,
  getActiveCanvas as getActiveCanvasFromBoard,
  resolveCanvas,
  withActiveCanvasId as withBoardActiveCanvasId,
  type CanvasBoard,
} from "../pixelCanvas/CanvasBoard";
import {
  createEmptyPixelCanvas,
  type PixelCanvas,
} from "../pixelCanvas/PixelCanvas";
import { updatePixelCanvasOnBoard } from "../pixelCanvas/PixelCanvasOperations";

export interface GridConfig {
  primary: number;
  secondary: number;
  visible: boolean;
}

/** @deprecated Use PixelCanvas from pixelCanvas/PixelCanvas.ts */
export type ProjectCanvas = PixelCanvas;

export interface Project {
  id: string;
  name: string;
  filePath: string | null;
  /** 项目绑定的快速导出目录；未设置时为 null */
  quickExportPath: string | null;
  createdAt: string;
  updatedAt: string;
  board: CanvasBoard;
  /** 工作区共享参考层，所有画板可见 */
  referenceLayers: ReferenceLayer[];
  activeReferenceLayerId: string | null;
  palette: Palette;
  luminancePalette: LuminancePaletteData;
  notes: Note[];
  grid: GridConfig;
  orthographicView: OrthographicViewConfig;
}

export const DEFAULT_GRID: GridConfig = {
  primary: 16,
  secondary: 8,
  visible: true,
};

/** 生成基于创建时间的默认项目名（文件名安全） */
export function createDefaultProjectName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}-${minutes}-${seconds}`;
}

export function createEmptyProject(name?: string, size?: CanvasSize): Project {
  const projectName = name ?? createDefaultProjectName();
  const now = new Date().toISOString();
  const canvasSize = size ?? DEFAULT_CANVAS_SIZE;

  return {
    id: crypto.randomUUID(),
    name: projectName,
    filePath: null,
    quickExportPath: null,
    createdAt: now,
    updatedAt: now,
    board: createCanvasBoard("画板 1", canvasSize),
    referenceLayers: [],
    activeReferenceLayerId: null,
    palette: Palette.empty(),
    luminancePalette: createEmptyLuminancePalette(),
    notes: [],
    grid: { ...DEFAULT_GRID },
    orthographicView: { ...DEFAULT_ORTHOGRAPHIC_VIEW },
  };
}

export function isUnsavedEmptyProject(project: Project): boolean {
  if (project.filePath) return false;
  const referencesEmpty = project.referenceLayers.every(
    (layer) => layer.imageData === null,
  );
  const canvasesEmpty = project.board.canvases.every((canvas) =>
    canvas.layers.every((layer) => {
      if (layer.type === "reference") return true;
      return layer.pixels.every((p) => p === 0);
    }),
  );
  return referencesEmpty && canvasesEmpty;
}

export interface ReferenceImageInput {
  imageData: string;
  imageSize: { width: number; height: number };
}

export function createProjectFromImage(
  name: string,
  canvasSize: { width: number; height: number },
  referenceImage: ReferenceImageInput,
  scaleFactor: number,
  palette: Palette,
): Project {
  const now = new Date().toISOString();
  const size = { width: canvasSize.width, height: canvasSize.height };
  const reference = setReferenceImage(
    createEmptyReferenceLayer("参考层"),
    referenceImage.imageData,
    referenceImage.imageSize,
    size,
  );
  const drawing = createEmptyDrawingLayer(size, "绘制层");
  const canvas = createEmptyPixelCanvas("画板 1", size);
  const pixelCanvas: PixelCanvas = {
    ...canvas,
    scaleFactor,
    layers: [drawing],
    activeLayerId: drawing.id,
  };

  return {
    id: crypto.randomUUID(),
    name,
    filePath: null,
    quickExportPath: null,
    createdAt: now,
    updatedAt: now,
    board: {
      canvases: [pixelCanvas],
      activeCanvasId: pixelCanvas.id,
      totalCanvasCount: 1,
    },
    referenceLayers: [reference],
    activeReferenceLayerId: reference.id,
    palette,
    luminancePalette: createEmptyLuminancePalette(),
    notes: [],
    grid: { ...DEFAULT_GRID },
    orthographicView: { ...DEFAULT_ORTHOGRAPHIC_VIEW },
  };
}

/** @deprecated Use createProjectFromImage with ReferenceImageInput */
export function createProjectFromPixelGrid(
  name: string,
  referenceGrid: PixelGrid,
  scaleFactor: number,
  palette: Palette,
): Project {
  const width = referenceGrid.width;
  const height = referenceGrid.height;
  const size = { width, height };
  const reference = createEmptyReferenceLayer("参考层");
  const drawing = createEmptyDrawingLayer(size, "绘制层");
  drawing.pixels = referenceGrid.toUint32Array();
  const canvas = createEmptyPixelCanvas("画板 1", size);
  const pixelCanvas: PixelCanvas = {
    ...canvas,
    scaleFactor,
    layers: [drawing],
    activeLayerId: drawing.id,
  };

  return {
    id: crypto.randomUUID(),
    name,
    filePath: null,
    quickExportPath: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    board: {
      canvases: [pixelCanvas],
      activeCanvasId: pixelCanvas.id,
      totalCanvasCount: 1,
    },
    referenceLayers: [reference],
    activeReferenceLayerId: reference.id,
    palette,
    luminancePalette: createEmptyLuminancePalette(),
    notes: [],
    grid: { ...DEFAULT_GRID },
    orthographicView: { ...DEFAULT_ORTHOGRAPHIC_VIEW },
  };
}

export function getActiveCanvas(project: Project): PixelCanvas {
  return getActiveCanvasFromBoard(project.board);
}

export function resolveProjectCanvas(project: Project, canvasId: string): PixelCanvas | undefined {
  return resolveCanvas(project.board, canvasId);
}

export function getCanvasSize(
  project: Project,
  canvasId?: string,
): { width: number; height: number } {
  const canvas = canvasId
    ? resolveProjectCanvas(project, canvasId)
    : getActiveCanvas(project);
  if (!canvas) {
    return { width: 0, height: 0 };
  }
  return { width: canvas.width, height: canvas.height };
}

export function getLayerById(
  project: Project,
  layerId: string,
  canvasId?: string,
): Layer | undefined {
  const reference = project.referenceLayers.find((l) => l.id === layerId);
  if (reference) return reference;

  const canvas = canvasId
    ? resolveProjectCanvas(project, canvasId)
    : getActiveCanvas(project);
  return canvas?.layers.find((l) => l.id === layerId);
}

export function getActiveLayer(project: Project, canvasId?: string): Layer {
  const canvas = canvasId
    ? resolveProjectCanvas(project, canvasId) ?? getActiveCanvas(project)
    : getActiveCanvas(project);
  const active = canvas.layers.find((l) => l.id === canvas.activeLayerId);
  if (active && isDrawingLayer(active)) return active;
  const drawing = canvas.layers.find((l) => l.type === "drawing");
  if (drawing) return drawing;
  return canvas.layers[0];
}

export function getActiveReferenceLayer(
  project: Project,
): ReferenceLayer | null {
  if (!project.activeReferenceLayerId) return null;
  const active = project.referenceLayers.find(
    (layer) => layer.id === project.activeReferenceLayerId,
  );
  return active ?? null;
}

export function getActiveLayerGrid(project: Project, canvasId?: string): PixelGrid {
  const layer = getActiveLayer(project, canvasId);
  if (!isDrawingLayer(layer)) {
    throw new Error("Active layer is not a drawing layer");
  }
  return getLayerGrid(layer);
}

export function getCompositeGrid(project: Project, canvasId?: string): PixelGrid {
  const canvas = canvasId
    ? resolveProjectCanvas(project, canvasId) ?? getActiveCanvas(project)
    : getActiveCanvas(project);
  return compositeDrawingLayers(canvas.layers, getCanvasSize(project, canvas.id));
}

export function withBoard(project: Project, board: CanvasBoard): Project {
  return { ...project, board };
}

export function withActiveCanvasId(project: Project, canvasId: string): Project {
  return {
    ...project,
    board: withBoardActiveCanvasId(project.board, canvasId),
  };
}

export function withLayers(
  project: Project,
  layers: Layer[],
  canvasId?: string,
): Project {
  const targetId = canvasId ?? getActiveCanvas(project).id;
  return touchProject({
    ...project,
    board: updatePixelCanvasOnBoard(project.board, targetId, { layers }),
  });
}

export function withActiveLayerId(
  project: Project,
  layerId: string,
  canvasId?: string,
): Project {
  const targetId = canvasId ?? getActiveCanvas(project).id;
  return touchProject({
    ...project,
    board: updatePixelCanvasOnBoard(project.board, targetId, { activeLayerId: layerId }),
  });
}

export function withActiveReferenceLayerId(
  project: Project,
  layerId: string | null,
): Project {
  return touchProject({
    ...project,
    activeReferenceLayerId: layerId,
  });
}

export function withReferenceLayers(
  project: Project,
  referenceLayers: ReferenceLayer[],
): Project {
  return touchProject({
    ...project,
    referenceLayers,
  });
}

export function withCanvasSize(
  project: Project,
  width: number,
  height: number,
  canvasId?: string,
): Project {
  const targetId = canvasId ?? getActiveCanvas(project).id;
  return touchProject({
    ...project,
    board: updatePixelCanvasOnBoard(project.board, targetId, { width, height }),
  });
}

export function resizeProjectCanvas(
  project: Project,
  width: number,
  height: number,
  canvasId?: string,
): Project {
  const targetId = canvasId ?? getActiveCanvas(project).id;
  const canvas = resolveProjectCanvas(project, targetId) ?? getActiveCanvas(project);
  const oldSize = { width: canvas.width, height: canvas.height };
  const newSize = createCanvasSize(width, height);
  if (oldSize.width === newSize.width && oldSize.height === newSize.height) {
    return project;
  }

  const isGrowing =
    newSize.width > oldSize.width || newSize.height > oldSize.height;
  const layers = isGrowing
    ? expandDrawingLayersForCanvasGrow(canvas.layers, oldSize, newSize)
    : canvas.layers;

  return touchProject({
    ...project,
    board: updatePixelCanvasOnBoard(project.board, targetId, {
      width: newSize.width,
      height: newSize.height,
      layers,
    }),
  });
}

export function addDrawingLayerToProject(
  project: Project,
  name?: string,
  canvasId?: string,
): Project {
  const targetId = canvasId ?? getActiveCanvas(project).id;
  const canvas = resolveProjectCanvas(project, targetId) ?? getActiveCanvas(project);
  const layers = addDrawingLayerOp(
    canvas.layers,
    getCanvasSize(project, targetId),
    name,
  );
  const newLayer = layers[layers.length - 1];
  return touchProject({
    ...withLayers(project, layers, targetId),
    board: updatePixelCanvasOnBoard(project.board, targetId, {
      layers,
      activeLayerId: newLayer.id,
    }),
  });
}

export function addReferenceLayerToProject(
  project: Project,
  name?: string,
): Project {
  const newLayer = createEmptyReferenceLayer(name);
  return touchProject({
    ...project,
    referenceLayers: [newLayer, ...project.referenceLayers],
    activeReferenceLayerId: newLayer.id,
  });
}

export function touchProject(project: Project): Project {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
  };
}

export function withOrthographicView(
  project: Project,
  patch: Partial<OrthographicViewConfig>,
): Project {
  return touchProject({
    ...project,
    orthographicView: { ...project.orthographicView, ...patch },
  });
}

export function withProjectFilePath(project: Project, filePath: string | null): Project {
  if (project.filePath === filePath) {
    return project;
  }
  return { ...project, filePath };
}

export function withQuickExportPath(
  project: Project,
  quickExportPath: string | null,
): Project {
  if (project.quickExportPath === quickExportPath) {
    return project;
  }
  return { ...project, quickExportPath };
}

/** 重命名项目；名称未变化或为空时返回 null */
export function renameProject(project: Project, name: string): Project | null {
  const trimmed = name.trim();
  if (!trimmed || trimmed === project.name) {
    return null;
  }
  return touchProject({ ...project, name: trimmed });
}

/** 兼容旧代码：返回活动画板 */
export function getProjectCanvas(project: Project): PixelCanvas {
  return getActiveCanvas(project);
}
