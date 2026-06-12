import type { Note } from "@/domain/note/Note";

import type { Layer, LayerType } from "@/domain/layer/Layer";

import { Palette } from "@/domain/palette/Palette";

import type { GridConfig, Project } from "@/domain/project/Project";

import { DEFAULT_GRID } from "@/domain/project/Project";



interface SerializedLayer {

  id: string;

  name: string;

  type: LayerType;

  visible: boolean;

  pixels: string;

}



interface SerializedCanvasV2 {

  width: number;

  height: number;

  scaleFactor: number;

  activeLayerId: string;

  layers: SerializedLayer[];

}



interface SerializedCanvasV1 {

  width: number;

  height: number;

  scaleFactor: number;

  referenceLayer: string;

  drawingLayer: string;

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



function encodeLayer(data: Uint32Array): string {

  const bytes = new Uint8Array(data.buffer);

  let binary = "";

  for (let i = 0; i < bytes.length; i++) {

    binary += String.fromCharCode(bytes[i]);

  }

  return btoa(binary);

}



function decodeLayer(base64: string, expectedLength: number): Uint32Array {

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



function serializeLayers(project: Project): SerializedLayer[] {

  const pixelCount = project.canvas.width * project.canvas.height;

  return project.canvas.layers.map((layer) => {

    if (layer.pixels.length !== pixelCount) {

      throw new Error(`Invalid layer size for layer ${layer.name}`);

    }

    return {

      id: layer.id,

      name: layer.name,

      type: layer.type,

      visible: layer.visible,

      pixels: encodeLayer(layer.pixels),

    };

  });

}



function migrateV1ToProject(data: SerializedProjectV1, filePath: string): Project {

  const pixelCount = data.canvas.width * data.canvas.height;

  const referencePixels = decodeLayer(data.canvas.referenceLayer, pixelCount);

  const drawingPixels = decodeLayer(data.canvas.drawingLayer, pixelCount);



  const referenceId = crypto.randomUUID();

  const drawingId = crypto.randomUUID();



  const layers: Layer[] = [

    {

      id: referenceId,

      name: "参考层",

      type: "reference",

      visible: true,

      pixels: referencePixels,

    },

    {

      id: drawingId,

      name: "绘制层",

      type: "drawing",

      visible: true,

      pixels: drawingPixels,

    },

  ];



  return {

    id: data.id,

    name: data.name,

    filePath,

    createdAt: data.createdAt,

    updatedAt: data.updatedAt,

    canvas: {

      width: data.canvas.width,

      height: data.canvas.height,

      scaleFactor: data.canvas.scaleFactor,

      layers,

      activeLayerId: drawingId,

    },

    palette: Palette.fromJSON(data.palette),

    notes: data.notes ?? [],

    grid: data.grid ?? { ...DEFAULT_GRID },

  };

}



export function serializeProject(project: Project): string {

  const data: SerializedProjectV2 = {

    version: 2,

    id: project.id,

    name: project.name,

    createdAt: project.createdAt,

    updatedAt: project.updatedAt,

    canvas: {

      width: project.canvas.width,

      height: project.canvas.height,

      scaleFactor: project.canvas.scaleFactor,

      activeLayerId: project.canvas.activeLayerId,

      layers: serializeLayers(project),

    },

    palette: project.palette.toJSON(),

    notes: project.notes,

    grid: project.grid,

  };

  return JSON.stringify(data, null, 2);

}



export function deserializeProject(json: string, filePath: string): Project {
  const data = JSON.parse(json) as { version?: number };

  if (!data.version || data.version === 1) {
    return migrateV1ToProject(data as SerializedProjectV1, filePath);
  }

  if (data.version !== 2) {
    throw new Error(`Unsupported project version: ${data.version}`);
  }

  const v2 = data as SerializedProjectV2;

  const pixelCount = v2.canvas.width * v2.canvas.height;

  const layers: Layer[] = v2.canvas.layers.map((sl) => ({

    id: sl.id,

    name: sl.name,

    type: sl.type,

    visible: sl.visible,

    pixels: decodeLayer(sl.pixels, pixelCount),

  }));



  const activeLayerId = layers.some((l) => l.id === v2.canvas.activeLayerId)

    ? v2.canvas.activeLayerId

    : layers.find((l) => l.type === "drawing")?.id ?? layers[0].id;



  return {

    id: v2.id,

    name: v2.name,

    filePath,

    createdAt: v2.createdAt,

    updatedAt: v2.updatedAt,

    canvas: {

      width: v2.canvas.width,

      height: v2.canvas.height,

      scaleFactor: v2.canvas.scaleFactor,

      layers,

      activeLayerId,

    },

    palette: Palette.fromJSON(v2.palette),

    notes: v2.notes ?? [],

    grid: v2.grid ?? { ...DEFAULT_GRID },

  };

}


