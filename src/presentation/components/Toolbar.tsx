import { useRef, useState } from "react";

import type { ToolType } from "@/domain/tool/ToolType";

import { TOOL_SHORTCUTS } from "../config/toolShortcuts";
import { getToolIcon } from "../icons/ToolIcons";

import { useAppStore, type ColorSlot } from "../stores/appStore";

import {
  ColorPickerPopover,
  ColorSwatchButton,
} from "./color-picker/ColorPickerPopover";

const TOOLS: { type: ToolType; label: string }[] = [
  { type: "brush", label: "画笔" },
  { type: "fill", label: "填充" },
  { type: "eraser", label: "橡皮" },
  { type: "shape", label: "形状" },
  { type: "select", label: "选区" },
  { type: "transform", label: "变换" },
];

export function Toolbar() {
  const activeTool = useAppStore((s) => s.activeTool);
  const foregroundColor = useAppStore((s) => s.foregroundColor);
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const floatingVisible = useAppStore((s) => s.floatingColorPicker.visible);
  const setActiveTool = useAppStore((s) => s.setActiveTool);
  const setColorSlot = useAppStore((s) => s.setColorSlot);
  const setFloatingColorPickerSlot = useAppStore((s) => s.setFloatingColorPickerSlot);

  const [colorPickerSlot, setColorPickerSlot] = useState<ColorSlot | null>(null);
  const foregroundSwatchRef = useRef<HTMLButtonElement>(null);
  const backgroundSwatchRef = useRef<HTMLButtonElement>(null);
  const activeSwatchRef =
    colorPickerSlot === "background" ? backgroundSwatchRef : foregroundSwatchRef;
  const activeColor = colorPickerSlot === "background" ? backgroundColor : foregroundColor;

  const handleSwatchToggle = (slot: ColorSlot) => {
    if (floatingVisible) {
      setFloatingColorPickerSlot(slot);
      return;
    }
    setColorPickerSlot((current) => (current === slot ? null : slot));
  };

  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-zinc-700 bg-zinc-900 py-3">
      {TOOLS.map((tool) => (
        <button
          key={tool.type}
          type="button"
          title={`${tool.label} (${TOOL_SHORTCUTS[tool.type]})`}
          onClick={() => setActiveTool(tool.type)}
          className={`flex h-10 w-10 items-center justify-center rounded text-xs font-medium transition ${
            activeTool === tool.type
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          {getToolIcon(tool.type)}
        </button>
      ))}

      <div className="my-2 h-px w-8 bg-zinc-700" />

      <div className="relative h-9 w-9">
        <ColorSwatchButton
          buttonRef={foregroundSwatchRef}
          color={foregroundColor}
          label="前景色（左键）"
          open={colorPickerSlot === "foreground"}
          className={`absolute left-0 top-0 ${
            colorPickerSlot !== "background" ? "z-10" : "z-0"
          }`}
          onToggle={() => handleSwatchToggle("foreground")}
        />
        <ColorSwatchButton
          buttonRef={backgroundSwatchRef}
          color={backgroundColor}
          label="背景色（右键）"
          open={colorPickerSlot === "background"}
          className={`absolute bottom-0 right-0 ${
            colorPickerSlot === "background" ? "z-10" : "z-0"
          }`}
          onToggle={() => handleSwatchToggle("background")}
        />
      </div>

      <ColorPickerPopover
        open={colorPickerSlot !== null && !floatingVisible}
        anchorRef={activeSwatchRef}
        activeSlot={colorPickerSlot ?? "foreground"}
        currentColor={activeColor}
        onChange={(color) => {
          if (colorPickerSlot) setColorSlot(colorPickerSlot, color);
        }}
        onClose={() => setColorPickerSlot(null)}
      />

      <p className="mt-auto px-1 text-center text-[9px] leading-tight text-zinc-600">
        左键前景 / 右键背景
        <br />
        Alt+点击取色
      </p>
    </aside>
  );
}
