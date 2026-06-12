import { useRef, useState } from "react";

import type { ShapeMode, ToolType } from "@/domain/tool/ToolType";

import { getShapeIcon, getToolIcon } from "../icons/ToolIcons";

import { useAppStore } from "../stores/appStore";

import {

  ColorPickerPopover,

  ColorSwatchButton,

} from "./color-picker/ColorPickerPopover";



const TOOLS: { type: ToolType; label: string }[] = [

  { type: "brush", label: "画笔" },

  { type: "fill", label: "填充" },

  { type: "eraser", label: "橡皮" },

  { type: "shape", label: "形状" },

];



const SHAPES: { mode: ShapeMode; label: string }[] = [

  { mode: "rectangle", label: "矩形" },

  { mode: "line", label: "直线" },

  { mode: "ellipse", label: "椭圆" },

];



export function Toolbar() {

  const activeTool = useAppStore((s) => s.activeTool);

  const toolSettings = useAppStore((s) => s.toolSettings);

  const currentColor = useAppStore((s) => s.currentColor);

  const setActiveTool = useAppStore((s) => s.setActiveTool);

  const setToolSettings = useAppStore((s) => s.setToolSettings);

  const setCurrentColor = useAppStore((s) => s.setCurrentColor);



  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const swatchRef = useRef<HTMLButtonElement>(null);



  return (

    <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-zinc-700 bg-zinc-900 py-3">

      {TOOLS.map((tool) => (

        <button

          key={tool.type}

          type="button"

          title={tool.label}

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



      <ColorSwatchButton

        buttonRef={swatchRef}

        color={currentColor}

        open={colorPickerOpen}

        onToggle={() => setColorPickerOpen((v) => !v)}

      />

      <ColorPickerPopover

        open={colorPickerOpen}

        anchorRef={swatchRef}

        currentColor={currentColor}

        onChange={setCurrentColor}

        onClose={() => setColorPickerOpen(false)}

      />



      <div className="mt-2 flex flex-col items-center gap-1">

        <span className="text-[10px] text-zinc-500">笔刷</span>

        <input

          type="range"

          min={1}

          max={8}

          value={toolSettings.brushSize}

          onChange={(e) => setToolSettings({ brushSize: Number(e.target.value) })}

          className="h-16 w-6"

          style={{ writingMode: "vertical-lr", direction: "rtl" }}

          title="笔刷大小"

        />

        <span className="text-xs text-zinc-400">{toolSettings.brushSize}</span>

      </div>



      {activeTool === "shape" && (

        <div className="mt-2 flex flex-col gap-1">

          {SHAPES.map((s) => (

            <button

              key={s.mode}

              type="button"

              title={s.label}

              onClick={() => setToolSettings({ shapeMode: s.mode })}

              className={`flex h-8 w-8 items-center justify-center rounded ${

                toolSettings.shapeMode === s.mode

                  ? "bg-blue-600 text-white"

                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"

              }`}

            >

              {getShapeIcon(s.mode)}

            </button>

          ))}

          <label className="mt-1 flex items-center gap-1 text-[10px] text-zinc-400">

            <input

              type="checkbox"

              checked={toolSettings.shapeFilled}

              onChange={(e) => setToolSettings({ shapeFilled: e.target.checked })}

            />

            填充

          </label>

        </div>

      )}



      <p className="mt-auto px-1 text-center text-[9px] leading-tight text-zinc-600">

        Alt+点击取色

      </p>

    </aside>

  );

}


