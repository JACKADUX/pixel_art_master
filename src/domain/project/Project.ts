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
  addReferenceLayer as addReferenceLayerOp,
  getLayerGrid,
} from "../layer/LayerOperations";
import { createCanvasSize, type CanvasSize } from "../canvas/CanvasSize";
import { DEFAULT_CANVAS_SIZE } from "../canvas/CanvasSizePreset";
import { isDrawingLayer, isReferenceLayer } from "../layer/LayerTypeGuards";
import type { ReferenceLayer } from "../layer/Layer";
import {
  setReferenceImage,
} from "../layer/ReferenceLayerOperations";
import type { Note } from "../note/Note";
import { Palette } from "../palette/Palette";
import {
  DEFAULT_ORTHOGRAPHIC_VIEW,
  type OrthographicViewConfig,
} from "../viewport/OrthographicView";

export interface GridConfig {
  primary: number;
  secondary: number;
  visible: boolean;
}

export interface ProjectCanvas {
  width: number;
  height: number;
  scaleFactor: number;
  layers: Layer[];
  activeLayerId: string;
  activeReferenceLayerId: string | null;
}

export interface Project {
  id: string;
  name: string;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
  canvas: ProjectCanvas;
  palette: Palette;
  notes: Note[];
  grid: GridConfig;
  orthographicView: OrthographicViewConfig;
}

export const DEFAULT_GRID: GridConfig = {
  primary: 16,
  secondary: 8,
  visible: true,
};

function createDefaultLayers(width: number, height: number): Layer[] {
  const size = { width, height };
  const drawing = createEmptyDrawingLayer(size, "绘制层");
  return [drawing];
}

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
  const width = canvasSize.width;
  const height = canvasSize.height;
  const layers = createDefaultLayers(width, height);
  const drawingLayer = layers.find((l) => l.type === "drawing")!;

  return {
    id: crypto.randomUUID(),
    name: projectName,
    filePath: null,
    createdAt: now,
    updatedAt: now,
    canvas: {
      width,
      height,
      scaleFactor: 1,
      layers,
      activeLayerId: drawingLayer.id,
      activeReferenceLayerId: null,
    },
    palette: Palette.empty(),
    notes: [],
    grid: { ...DEFAULT_GRID },
    orthographicView: { ...DEFAULT_ORTHOGRAPHIC_VIEW },
  };
}

export function isUnsavedEmptyProject(project: Project): boolean {
  if (project.filePath) return false;
  return project.canvas.layers.every((layer) => {
    if (layer.type === "reference") {
      return layer.imageData === null;
    }
    return layer.pixels.every((p) => p === 0);
  });
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

  return {
    id: crypto.randomUUID(),
    name,
    filePath: null,
    createdAt: now,
    updatedAt: now,
    canvas: {
      width: canvasSize.width,
      height: canvasSize.height,
      scaleFactor,
      layers: [reference, drawing],
      activeLayerId: drawing.id,
      activeReferenceLayerId: reference.id,
    },
    palette,
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

  return {
    id: crypto.randomUUID(),
    name,
    filePath: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    canvas: {
      width,
      height,
      scaleFactor,
      layers: [reference, drawing],
      activeLayerId: drawing.id,
      activeReferenceLayerId: reference.id,
    },
    palette,
    notes: [],
    grid: { ...DEFAULT_GRID },
    orthographicView: { ...DEFAULT_ORTHOGRAPHIC_VIEW },
  };
}

export function getCanvasSize(project: Project): { width: number; height: number } {
  return { width: project.canvas.width, height: project.canvas.height };
}

export function getLayerById(project: Project, layerId: string): Layer | undefined {
  return project.canvas.layers.find((l) => l.id === layerId);
}

export function getActiveLayer(project: Project): Layer {
  const active = getLayerById(project, project.canvas.activeLayerId);
  if (active && isDrawingLayer(active)) return active;
  const drawing = project.canvas.layers.find((l) => l.type === "drawing");
  if (drawing) return drawing;
  return project.canvas.layers[0];
}

export function getActiveReferenceLayer(project: Project): ReferenceLayer | null {
  const { activeReferenceLayerId, layers } = project.canvas;
  if (!activeReferenceLayerId) return null;
  const active = layers.find((l) => l.id === activeReferenceLayerId);
  return active && isReferenceLayer(active) ? active : null;
}

export function getActiveLayerGrid(project: Project): PixelGrid {
  const layer = getActiveLayer(project);
  if (!isDrawingLayer(layer)) {
    throw new Error("Active layer is not a drawing layer");
  }
  return getLayerGrid(layer);
}

export function getCompositeGrid(project: Project): PixelGrid {
  return compositeDrawingLayers(project.canvas.layers, getCanvasSize(project));
}

export function withLayers(project: Project, layers: Layer[]): Project {
  return {
    ...project,
    canvas: { ...project.canvas, layers },
  };
}

export function withActiveLayerId(project: Project, layerId: string): Project {
  return {
    ...project,
    canvas: { ...project.canvas, activeLayerId: layerId },
  };
}

export function withActiveReferenceLayerId(
  project: Project,
  layerId: string | null,
): Project {
  return {
    ...project,
    canvas: { ...project.canvas, activeReferenceLayerId: layerId },
  };
}

export function withCanvasSize(
  project: Project,
  width: number,
  height: number,
): Project {
  return {
    ...project,
    canvas: { ...project.canvas, width, height },
  };
}

export function resizeProjectCanvas(
  project: Project,
  width: number,
  height: number,
): Project {
  const oldSize = getCanvasSize(project);
  const newSize = createCanvasSize(width, height);
  if (oldSize.width === newSize.width && oldSize.height === newSize.height) {
    return project;
  }

  const isGrowing =
    newSize.width > oldSize.width || newSize.height > oldSize.height;
  const layers = isGrowing
    ? expandDrawingLayersForCanvasGrow(project.canvas.layers, oldSize, newSize)
    : project.canvas.layers;

  return touchProject({
    ...project,
    canvas: {
      ...project.canvas,
      width: newSize.width,
      height: newSize.height,
      layers,
    },
  });
}

export function addDrawingLayerToProject(project: Project, name?: string): Project {
  const layers = addDrawingLayerOp(
    project.canvas.layers,
    getCanvasSize(project),
    name,
  );
  const newLayer = layers[layers.length - 1];
  return touchProject({
    ...withLayers(project, layers),
    canvas: { ...project.canvas, layers, activeLayerId: newLayer.id },
  });
}

export function addReferenceLayerToProject(project: Project, name?: string): Project {
  const layers = addReferenceLayerOp(project.canvas.layers, name);
  const newLayer = layers.find(
    (layer) =>
      layer.type === "reference" &&
      !project.canvas.layers.some((existing) => existing.id === layer.id),
  );
  return touchProject({
    ...withLayers(project, layers),
    canvas: {
      ...project.canvas,
      layers,
      activeReferenceLayerId: newLayer?.id ?? project.canvas.activeReferenceLayerId,
    },
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

/** 重命名项目；名称未变化或为空时返回 null */
export function renameProject(project: Project, name: string): Project | null {
  const trimmed = name.trim();
  if (!trimmed || trimmed === project.name) {
    return null;
  }
  return touchProject({ ...project, name: trimmed });
}
