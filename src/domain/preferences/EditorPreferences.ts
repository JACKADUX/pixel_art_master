import { rgba, TRANSPARENT, type PixelColor } from "@/domain/canvas/PixelColor";
import type { CanvasDisplayMode } from "@/domain/color/CanvasDisplayMode";
import type { ColorMode } from "@/domain/color/ColorMode";
import {
  COLOR_PICKER_LAYOUT_ORIENTATIONS,
  COLOR_PICKER_VERTICAL_WIDTH,
  type ColorPickerLayoutOrientation,
} from "@/domain/color/ColorPickerLayout";
import {
  DEFAULT_PANEL_EDGE_ANCHOR,
  type PanelEdgeAnchor,
} from "@/domain/viewport/FloatingPanelAnchor";
import {
  clampStampSize,
  clampMagicWandTolerance,
  DEFAULT_TOOL_SETTINGS,
  type BrushShape,
  type SelectionMode,
  type ShapeMode,
  type ToolSettings,
  type ToolType,
  type TransformMode,
} from "@/domain/tool/ToolType";

export type EditorColorSlot = "foreground" | "background";

export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelSize {
  width: number;
  height: number;
}

export interface NavigatorPanelLayout {
  visible: boolean;
  position: PanelPosition;
  size: PanelSize;
  edgeAnchor: PanelEdgeAnchor;
}

export interface FloatingColorPickerLayout {
  visible: boolean;
  position: PanelPosition;
  panelWidth: number;
  panelHeight: number;
  activeSlot: EditorColorSlot;
  edgeAnchor: PanelEdgeAnchor;
}

export interface EditorPreferences {
  activeTool: ToolType;
  toolSettings: ToolSettings;
  foregroundColor: PixelColor;
  backgroundColor: PixelColor;
  zoom: number;
  rightPanelTab: "palette" | "notes";
  paletteViewMode: "grid" | "oklabMap";
  colorPickerMode: ColorMode;
  colorPickerLayoutOrientation: ColorPickerLayoutOrientation;
  sidebarWidth: number;
  splitPaneRatio: number;
  navigatorLayout: NavigatorPanelLayout;
  floatingColorPickerLayout: FloatingColorPickerLayout;
  mousePositionOverlayVisible: boolean;
  canvasDisplayMode: CanvasDisplayMode;
  assetLibraryDrawerExpanded: boolean;
  assetLibraryDrawerHeight: number;
}

export const EDITOR_PREFERENCES_VERSION = 1;

export const DEFAULT_SIDEBAR_WIDTH = 224;
export const DEFAULT_SPLIT_PANE_RATIO = 0.55;
export const DEFAULT_NAVIGATOR_WIDTH = 160;
export const DEFAULT_NAVIGATOR_HEIGHT = 120;
export const DEFAULT_COLOR_PICKER_PANEL_HEIGHT = 400;

const MIN_ZOOM = 1;
const MAX_ZOOM = 32;
const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 400;
const MIN_SPLIT_PANE_RATIO = 0.15;
const MAX_SPLIT_PANE_RATIO = 0.85;
const MIN_NAVIGATOR_WIDTH = 100;
const MIN_NAVIGATOR_HEIGHT = 80;
const MIN_COLOR_PICKER_HEIGHT = 280;
const MAX_COLOR_PICKER_HEIGHT = 720;
const MIN_COLOR_PICKER_WIDTH = 200;
const MAX_COLOR_PICKER_WIDTH = 800;
const MIN_ASSET_DRAWER_HEIGHT = 120;
const MAX_ASSET_DRAWER_HEIGHT = 800;
export const DEFAULT_ASSET_DRAWER_HEIGHT = 320;

const TOOL_TYPES: ToolType[] = ["brush", "fill", "eraser", "shape", "select", "transform"];
const BRUSH_SHAPES: BrushShape[] = ["square", "circle"];
const SHAPE_MODES: ShapeMode[] = ["rectangle", "line", "ellipse"];
const SELECTION_MODES: SelectionMode[] = ["rectangle", "ellipse", "lasso", "magicWand"];
const TRANSFORM_MODES: TransformMode[] = ["move", "scale", "rotate"];
const COLOR_MODES: ColorMode[] = ["hsl", "oklab"];
const COLOR_SLOTS: EditorColorSlot[] = ["foreground", "background"];
const PANEL_TABS = ["palette", "notes"] as const;
const PALETTE_VIEW_MODES = ["grid", "oklabMap"] as const;
const CANVAS_DISPLAY_MODES = ["normal", "oklabLightness"] as const;

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  activeTool: "brush",
  toolSettings: { ...DEFAULT_TOOL_SETTINGS },
  foregroundColor: rgba(255, 0, 0),
  backgroundColor: TRANSPARENT,
  zoom: 8,
  rightPanelTab: "palette",
  paletteViewMode: "grid",
  colorPickerMode: "hsl",
  colorPickerLayoutOrientation: "vertical",
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  splitPaneRatio: DEFAULT_SPLIT_PANE_RATIO,
  navigatorLayout: {
    visible: false,
    position: { x: 16, y: 16 },
    size: { width: DEFAULT_NAVIGATOR_WIDTH, height: DEFAULT_NAVIGATOR_HEIGHT },
    edgeAnchor: { ...DEFAULT_PANEL_EDGE_ANCHOR },
  },
  floatingColorPickerLayout: {
    visible: false,
    position: { x: 16, y: 16 },
    panelWidth: COLOR_PICKER_VERTICAL_WIDTH,
    panelHeight: DEFAULT_COLOR_PICKER_PANEL_HEIGHT,
    activeSlot: "foreground",
    edgeAnchor: { ...DEFAULT_PANEL_EDGE_ANCHOR },
  },
  mousePositionOverlayVisible: false,
  canvasDisplayMode: "normal",
  assetLibraryDrawerExpanded: false,
  assetLibraryDrawerHeight: DEFAULT_ASSET_DRAWER_HEIGHT,
};

export interface EditorPreferencesSource {
  activeTool: ToolType;
  toolSettings: ToolSettings;
  foregroundColor: PixelColor;
  backgroundColor: PixelColor;
  zoom: number;
  rightPanelTab: "palette" | "notes";
  paletteViewMode: "grid" | "oklabMap";
  colorPickerMode: ColorMode;
  colorPickerLayoutOrientation: ColorPickerLayoutOrientation;
  sidebarWidth: number;
  splitPaneRatio: number;
  navigator: {
    visible: boolean;
    position: PanelPosition;
    size: PanelSize;
    edgeAnchor: PanelEdgeAnchor;
  };
  floatingColorPicker: {
    visible: boolean;
    position: PanelPosition;
    panelWidth: number;
    panelHeight: number;
    activeSlot: EditorColorSlot;
    edgeAnchor: PanelEdgeAnchor;
  };
  mousePositionOverlayVisible: boolean;
  canvasDisplayMode: CanvasDisplayMode;
  assetLibraryDrawerExpanded: boolean;
  assetLibraryDrawerHeight: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function parsePixelColor(value: unknown, fallback: PixelColor): PixelColor {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return (value >>> 0) as PixelColor;
}

function parsePosition(value: unknown, fallback: PanelPosition): PanelPosition {
  if (!isRecord(value)) return fallback;
  return {
    x: clampNumber(value.x, 0, 10000, fallback.x),
    y: clampNumber(value.y, 0, 10000, fallback.y),
  };
}

function parseSize(value: unknown, fallback: PanelSize, minWidth: number, minHeight: number): PanelSize {
  if (!isRecord(value)) return fallback;
  return {
    width: clampNumber(value.width, minWidth, 2000, fallback.width),
    height: clampNumber(value.height, minHeight, 2000, fallback.height),
  };
}

function parseEdgeAnchor(value: unknown, fallback: PanelEdgeAnchor): PanelEdgeAnchor {
  if (!isRecord(value)) return { ...fallback };
  const horizontal =
    value.horizontal === "left" || value.horizontal === "right" || value.horizontal === "none"
      ? value.horizontal
      : fallback.horizontal;
  const vertical =
    value.vertical === "top" || value.vertical === "bottom" || value.vertical === "none"
      ? value.vertical
      : fallback.vertical;
  return { horizontal, vertical };
}

function parseToolSettings(value: unknown): ToolSettings {
  const defaults = DEFAULT_EDITOR_PREFERENCES.toolSettings;
  if (!isRecord(value)) return { ...defaults };

  const brushShape = BRUSH_SHAPES.includes(value.brushShape as BrushShape)
    ? (value.brushShape as BrushShape)
    : defaults.brushShape;
  const eraserShape = BRUSH_SHAPES.includes(value.eraserShape as BrushShape)
    ? (value.eraserShape as BrushShape)
    : defaults.eraserShape;
  const shapeMode = SHAPE_MODES.includes(value.shapeMode as ShapeMode)
    ? (value.shapeMode as ShapeMode)
    : defaults.shapeMode;
  const selectionMode = SELECTION_MODES.includes(value.selectionMode as SelectionMode)
    ? (value.selectionMode as SelectionMode)
    : defaults.selectionMode;
  const transformMode = TRANSFORM_MODES.includes(value.transformMode as TransformMode)
    ? (value.transformMode as TransformMode)
    : defaults.transformMode;

  return {
    brushSize: clampStampSize(
      typeof value.brushSize === "number" ? value.brushSize : defaults.brushSize,
    ),
    brushShape,
    brushPerfectPixel:
      typeof value.brushPerfectPixel === "boolean"
        ? value.brushPerfectPixel
        : defaults.brushPerfectPixel,
    eraserSize: clampStampSize(
      typeof value.eraserSize === "number" ? value.eraserSize : defaults.eraserSize,
    ),
    eraserShape,
    shapeMode,
    shapeFilled: typeof value.shapeFilled === "boolean" ? value.shapeFilled : defaults.shapeFilled,
    selectionMode,
    magicWandTolerance: clampMagicWandTolerance(
      typeof value.magicWandTolerance === "number"
        ? value.magicWandTolerance
        : defaults.magicWandTolerance,
    ),
    magicWandContiguous:
      typeof value.magicWandContiguous === "boolean"
        ? value.magicWandContiguous
        : defaults.magicWandContiguous,
    transformMode,
  };
}

function parseNavigatorLayout(value: unknown): NavigatorPanelLayout {
  const defaults = DEFAULT_EDITOR_PREFERENCES.navigatorLayout;
  if (!isRecord(value)) return { ...defaults };

  return {
    visible: typeof value.visible === "boolean" ? value.visible : defaults.visible,
    position: parsePosition(value.position, defaults.position),
    size: parseSize(value.size, defaults.size, MIN_NAVIGATOR_WIDTH, MIN_NAVIGATOR_HEIGHT),
    edgeAnchor: parseEdgeAnchor(value.edgeAnchor, defaults.edgeAnchor),
  };
}

function parseFloatingColorPickerLayout(value: unknown): FloatingColorPickerLayout {
  const defaults = DEFAULT_EDITOR_PREFERENCES.floatingColorPickerLayout;
  if (!isRecord(value)) return { ...defaults };

  const activeSlot = COLOR_SLOTS.includes(value.activeSlot as EditorColorSlot)
    ? (value.activeSlot as EditorColorSlot)
    : defaults.activeSlot;

  return {
    visible: typeof value.visible === "boolean" ? value.visible : defaults.visible,
    position: parsePosition(value.position, defaults.position),
    panelWidth: clampNumber(
      value.panelWidth,
      MIN_COLOR_PICKER_WIDTH,
      MAX_COLOR_PICKER_WIDTH,
      defaults.panelWidth,
    ),
    panelHeight: clampNumber(
      value.panelHeight,
      MIN_COLOR_PICKER_HEIGHT,
      MAX_COLOR_PICKER_HEIGHT,
      defaults.panelHeight,
    ),
    activeSlot,
    edgeAnchor: parseEdgeAnchor(value.edgeAnchor, defaults.edgeAnchor),
  };
}

export function parseEditorPreferences(raw: unknown): EditorPreferences {
  const defaults = DEFAULT_EDITOR_PREFERENCES;
  if (!isRecord(raw)) return { ...defaults };

  const activeTool = TOOL_TYPES.includes(raw.activeTool as ToolType)
    ? (raw.activeTool as ToolType)
    : defaults.activeTool;
  const rightPanelTab = PANEL_TABS.includes(raw.rightPanelTab as (typeof PANEL_TABS)[number])
    ? (raw.rightPanelTab as (typeof PANEL_TABS)[number])
    : defaults.rightPanelTab;
  const paletteViewMode = PALETTE_VIEW_MODES.includes(
    raw.paletteViewMode as (typeof PALETTE_VIEW_MODES)[number],
  )
    ? (raw.paletteViewMode as (typeof PALETTE_VIEW_MODES)[number])
    : defaults.paletteViewMode;
  const colorPickerMode = COLOR_MODES.includes(raw.colorPickerMode as ColorMode)
    ? (raw.colorPickerMode as ColorMode)
    : defaults.colorPickerMode;
  const colorPickerLayoutOrientation = COLOR_PICKER_LAYOUT_ORIENTATIONS.includes(
    raw.colorPickerLayoutOrientation as ColorPickerLayoutOrientation,
  )
    ? (raw.colorPickerLayoutOrientation as ColorPickerLayoutOrientation)
    : defaults.colorPickerLayoutOrientation;
  const canvasDisplayMode = CANVAS_DISPLAY_MODES.includes(
    raw.canvasDisplayMode as CanvasDisplayMode,
  )
    ? (raw.canvasDisplayMode as CanvasDisplayMode)
    : defaults.canvasDisplayMode;

  return {
    activeTool,
    toolSettings: parseToolSettings(raw.toolSettings),
    foregroundColor: parsePixelColor(raw.foregroundColor, defaults.foregroundColor),
    backgroundColor: parsePixelColor(raw.backgroundColor, defaults.backgroundColor),
    zoom: clampNumber(raw.zoom, MIN_ZOOM, MAX_ZOOM, defaults.zoom),
    rightPanelTab,
    paletteViewMode,
    colorPickerMode,
    colorPickerLayoutOrientation,
    sidebarWidth: clampNumber(
      raw.sidebarWidth,
      MIN_SIDEBAR_WIDTH,
      MAX_SIDEBAR_WIDTH,
      defaults.sidebarWidth,
    ),
    splitPaneRatio: clampNumber(
      raw.splitPaneRatio,
      MIN_SPLIT_PANE_RATIO,
      MAX_SPLIT_PANE_RATIO,
      defaults.splitPaneRatio,
    ),
    navigatorLayout: parseNavigatorLayout(raw.navigatorLayout ?? raw.navigator),
    floatingColorPickerLayout: parseFloatingColorPickerLayout(
      raw.floatingColorPickerLayout ?? raw.floatingColorPicker,
    ),
    mousePositionOverlayVisible:
      typeof raw.mousePositionOverlayVisible === "boolean"
        ? raw.mousePositionOverlayVisible
        : defaults.mousePositionOverlayVisible,
    canvasDisplayMode,
    assetLibraryDrawerExpanded:
      typeof raw.assetLibraryDrawerExpanded === "boolean"
        ? raw.assetLibraryDrawerExpanded
        : defaults.assetLibraryDrawerExpanded,
    assetLibraryDrawerHeight: clampNumber(
      raw.assetLibraryDrawerHeight,
      MIN_ASSET_DRAWER_HEIGHT,
      MAX_ASSET_DRAWER_HEIGHT,
      defaults.assetLibraryDrawerHeight,
    ),
  };
}

export function extractEditorPreferences(source: EditorPreferencesSource): EditorPreferences {
  return {
    activeTool: source.activeTool,
    toolSettings: { ...source.toolSettings },
    foregroundColor: source.foregroundColor,
    backgroundColor: source.backgroundColor,
    zoom: clampNumber(source.zoom, MIN_ZOOM, MAX_ZOOM, DEFAULT_EDITOR_PREFERENCES.zoom),
    rightPanelTab: source.rightPanelTab,
    paletteViewMode: source.paletteViewMode,
    colorPickerMode: source.colorPickerMode,
    colorPickerLayoutOrientation: source.colorPickerLayoutOrientation,
    sidebarWidth: clampNumber(
      source.sidebarWidth,
      MIN_SIDEBAR_WIDTH,
      MAX_SIDEBAR_WIDTH,
      DEFAULT_EDITOR_PREFERENCES.sidebarWidth,
    ),
    splitPaneRatio: clampNumber(
      source.splitPaneRatio,
      MIN_SPLIT_PANE_RATIO,
      MAX_SPLIT_PANE_RATIO,
      DEFAULT_EDITOR_PREFERENCES.splitPaneRatio,
    ),
    navigatorLayout: {
      visible: source.navigator.visible,
      position: { ...source.navigator.position },
      size: { ...source.navigator.size },
      edgeAnchor: { ...source.navigator.edgeAnchor },
    },
    floatingColorPickerLayout: {
      visible: source.floatingColorPicker.visible,
      position: { ...source.floatingColorPicker.position },
      panelWidth: source.floatingColorPicker.panelWidth,
      panelHeight: source.floatingColorPicker.panelHeight,
      activeSlot: source.floatingColorPicker.activeSlot,
      edgeAnchor: { ...source.floatingColorPicker.edgeAnchor },
    },
    mousePositionOverlayVisible: source.mousePositionOverlayVisible,
    canvasDisplayMode: source.canvasDisplayMode,
    assetLibraryDrawerExpanded: source.assetLibraryDrawerExpanded,
    assetLibraryDrawerHeight: clampNumber(
      source.assetLibraryDrawerHeight,
      MIN_ASSET_DRAWER_HEIGHT,
      MAX_ASSET_DRAWER_HEIGHT,
      DEFAULT_EDITOR_PREFERENCES.assetLibraryDrawerHeight,
    ),
  };
}
