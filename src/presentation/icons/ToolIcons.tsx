import {
  BackspaceIcon,
  MinusIcon,
  PaintBrushIcon,
  Squares2X2Icon,
  StopIcon,
  SwatchIcon,
} from "@heroicons/react/16/solid";
import type { ComponentType } from "react";
import type { ShapeMode, ToolType } from "@/domain/tool/ToolType";

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
  brush: PaintBrushIcon,
  fill: SwatchIcon,
  eraser: BackspaceIcon,
  shape: Squares2X2Icon,
} satisfies Record<ToolType, ComponentType<{ className?: string }>>;

const SHAPE_ICONS = {
  rectangle: StopIcon,
  line: MinusIcon,
  ellipse: EllipseIcon,
} satisfies Record<ShapeMode, ComponentType<{ className?: string }>>;

export function getToolIcon(type: ToolType, className = TOOL_ICON_CLASS) {
  const Icon = TOOL_ICONS[type];
  return <Icon className={className} />;
}

export function getShapeIcon(mode: ShapeMode, className = SHAPE_ICON_CLASS) {
  const Icon = SHAPE_ICONS[mode];
  return <Icon className={className} />;
}
