import {
  MinusIcon,
  StopIcon,
} from "@heroicons/react/16/solid";
import {
  Circle,
  Eraser,
  InspectionPanel,
  LineSquiggle,
  Move,
  PaintBucket,
  Pencil,
  SquareArrowDownRight,
  SquareDashed,
  Wand,
} from "lucide-react";
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

const TOOL_ICONS = {
  brush: Pencil,
  fill: PaintBucket,
  eraser: Eraser,
  shape: Circle,
  select: SquareDashed,
  transform: Move,
  repeatTile: InspectionPanel,
  canvasResize: SquareArrowDownRight,
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
  lasso: LineSquiggle,
  magicWand: Wand,
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
