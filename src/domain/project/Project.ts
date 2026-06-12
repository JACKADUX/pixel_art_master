import type { PixelGrid } from "../canvas/PixelGrid";
import { compositeLayers } from "../layer/LayerCompositor";
import {
  createEmptyLayer,
  createLayer,
  type Layer,
} from "../layer/Layer";
import {
  addDrawingLayer as addDrawingLayerOp,
  addReferenceLayer as addReferenceLayerOp,
  getLayerGrid,
} from "../layer/LayerOperations";
import type { Note } from "../note/Note";
import { Palette } from "../palette/Palette";

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
}

export const DEFAULT_GRID: GridConfig = {
  primary: 16,
  secondary: 8,
  visible: true,
};

function createDefaultLayers(width: number, height: number): Layer[] {
  const size = { width, height };
  const reference = createEmptyLayer("reference", size, "参考层");
  const drawing = createEmptyLayer("drawing", size, "绘制层");
  return [reference, drawing];
}

export function createEmptyProject(name = "未命名项目"): Project {
  const now = new Date().toISOString();
  const width = 64;
  const height = 64;
  const layers = createDefaultLayers(width, height);
  const drawingLayer = layers.find((l) => l.type === "drawing")!;

  return {
    id: crypto.randomUUID(),
    name,
    filePath: null,
    createdAt: now,
    updatedAt: now,
    canvas: {
      width,
      height,
      scaleFactor: 1,
      layers,
      activeLayerId: drawingLayer.id,
    },
    palette: Palette.empty(),
    notes: [],
    grid: { ...DEFAULT_GRID },
  };
}

export function isUnsavedEmptyProject(project: Project): boolean {
  if (project.filePath) return false;
  return project.canvas.layers.every((layer) =>
    layer.pixels.every((p) => p === 0),
  );
}

export function createProjectFromImage(
  name: string,
  referenceGrid: PixelGrid,
  scaleFactor: number,
  palette: Palette,
): Project {
  const now = new Date().toISOString();
  const width = referenceGrid.width;
  const height = referenceGrid.height;
  const size = { width, height };
  const reference = createLayer("reference", referenceGrid, "参考层");
  const drawing = createEmptyLayer("drawing", size, "绘制层");

  return {
    id: crypto.randomUUID(),
    name,
    filePath: null,
    createdAt: now,
    updatedAt: now,
    canvas: {
      width,
      height,
      scaleFactor,
      layers: [reference, drawing],
      activeLayerId: drawing.id,
    },
    palette,
    notes: [],
    grid: { ...DEFAULT_GRID },
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
  if (active) return active;
  const drawing = project.canvas.layers.find((l) => l.type === "drawing");
  if (drawing) return drawing;
  return project.canvas.layers[0];
}

export function getActiveLayerGrid(project: Project): PixelGrid {
  const layer = getActiveLayer(project);
  return getLayerGrid(layer, getCanvasSize(project));
}

export function getCompositeGrid(project: Project): PixelGrid {
  return compositeLayers(project.canvas.layers, getCanvasSize(project));
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

export function addReferenceLayerToProject(
  project: Project,
  grid: PixelGrid,
  name?: string,
): Project {
  const layers = addReferenceLayerOp(project.canvas.layers, grid, name);
  return touchProject(withLayers(project, layers));
}

export function touchProject(project: Project): Project {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
  };
}
