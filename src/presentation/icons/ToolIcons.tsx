import {
  BackspaceIcon,
  CursorArrowRaysIcon,
  MinusIcon,
  PaintBrushIcon,
  Squares2X2Icon,
  StopIcon,
  SwatchIcon,
  ViewfinderCircleIcon,
} from "@heroicons/react/16/solid";
import type { ComponentType } from "react";
import type {
  BrushShape,
  SelectionMode,
  ShapeMode,
  ToolType,
} from "@/domain/tool/ToolType";

const TOOL_ICON_CLASS = "h-5 w-5";
const SHAPE_ICON_CLASS = "h-4 w-4";

function EllipseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="8" cy="8" rx="6" ry="4.5" />
    </svg>
  );
}

function LassoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path
        d="M10 3c1.5 0 2.5 1.2 2.5 2.5S11.5 8 10 8H8l-3 3.5a2 2 0 1 1-2.8-2.8L6.5 6.5V5c0-1.1.9-2 2-2h1.5z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MagicWandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9.5 1 8 4.5 4.5 6 8 7.5 9.5 11l1.5-3.5L14.5 6 11 4.5 9.5 1ZM2 12l1.5 1.5L2 15l1.5-1.5L5 15l-1.5-1.5L5 12 3.5 13.5 2 12Z" />
    </svg>
  );
}

function RepeatTileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <rect x="5.5" y="5.5" width="5" height="5" strokeWidth="1.25" />
      <rect x="0.5" y="5.5" width="4" height="5" strokeWidth="1" opacity="0.7" />
      <rect x="11.5" y="5.5" width="4" height="5" strokeWidth="1" opacity="0.7" />
      <rect x="5.5" y="0.5" width="5" height="4" strokeWidth="1" opacity="0.7" />
      <rect x="5.5" y="11.5" width="5" height="4" strokeWidth="1" opacity="0.7" />
      <rect x="0.5" y="0.5" width="4" height="4" strokeWidth="1" opacity="0.5" />
      <rect x="11.5" y="0.5" width="4" height="4" strokeWidth="1" opacity="0.5" />
      <rect x="0.5" y="11.5" width="4" height="4" strokeWidth="1" opacity="0.5" />
      <rect x="11.5" y="11.5" width="4" height="4" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

const TOOL_ICONS = {
  brush: PaintBrushIcon,
  fill: SwatchIcon,
  eraser: BackspaceIcon,
  shape: Squares2X2Icon,
  select: CursorArrowRaysIcon,
  transform: ViewfinderCircleIcon,
  repeatTile: RepeatTileIcon,
} satisfies Record<ToolType, ComponentType<{ className?: string }>>;

function CircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" />
    </svg>
  );
}

function PatternBrushIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <rect x="2" y="2" width="4" height="4" />
      <rect x="7" y="2" width="4" height="4" opacity="0.6" />
      <rect x="2" y="7" width="4" height="4" opacity="0.6" />
      <rect x="7" y="7" width="4" height="4" />
    </svg>
  );
}

const BRUSH_SHAPE_ICONS = {
  square: StopIcon,
  circle: CircleIcon,
  pattern: PatternBrushIcon,
} satisfies Record<BrushShape, ComponentType<{ className?: string }>>;

const SHAPE_ICONS = {
  rectangle: StopIcon,
  line: MinusIcon,
  ellipse: EllipseIcon,
} satisfies Record<ShapeMode, ComponentType<{ className?: string }>>;

const SELECTION_MODE_ICONS = {
  rectangle: StopIcon,
  ellipse: EllipseIcon,
  lasso: LassoIcon,
  magicWand: MagicWandIcon,
} satisfies Record<SelectionMode, ComponentType<{ className?: string }>>;

export function getToolIcon(type: ToolType, className = TOOL_ICON_CLASS) {
  const Icon = TOOL_ICONS[type];
  return <Icon className={className} />;
}

export function getShapeIcon(mode: ShapeMode, className = SHAPE_ICON_CLASS) {
  const Icon = SHAPE_ICONS[mode];
  return <Icon className={className} />;
}

export function getBrushShapeIcon(shape: BrushShape, className = SHAPE_ICON_CLASS) {
  const Icon = BRUSH_SHAPE_ICONS[shape];
  return <Icon className={className} />;
}

export function getSelectionModeIcon(mode: SelectionMode, className = SHAPE_ICON_CLASS) {
  const Icon = SELECTION_MODE_ICONS[mode];
  return <Icon className={className} />;
}

export function SymmetryHorizontalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8h1.5L5.5 6.5 7 8 5.5 9.5 5 8Zm6 0H9.5L10.5 6.5 9 8l1.5 1.5.5-1.5Z" fill="currentColor" />
    </svg>
  );
}

export function SymmetryVerticalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5v1.5L6.5 5.5 8 7l1.5-1.5L8 5Zm0 6V9.5l1.5 1.5L8 9l-1.5 1.5L8 11Z" fill="currentColor" />
    </svg>
  );
}
