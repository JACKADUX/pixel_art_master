import { useEffect, useMemo, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile, readTextFile } from "@tauri-apps/plugin-fs";
import { fromHex } from "@/domain/canvas/PixelColor";
import {
  colorEntriesToPaletteItems,
  DEFAULT_PALETTE_HEX,
  imageDataToPaletteItems,
  parseHexText,
  pixelColorToHexValue,
  type PaletteColorItem,
} from "@/domain/comfyApp/PaletteComponent";
import { listPalettePresets } from "@/domain/palette/PalettePresetLibrary";
import { decodeImageBlobToImageData } from "@/infrastructure/image/decodeImageBlob";
import { ContextMenu } from "@/presentation/components/ContextMenu";
import type { MenuItem } from "@/presentation/components/MenuDropdown";
import { useAppStore } from "@/presentation/stores/appStore";
import type { PaletteRunnerValue } from "@/presentation/stores/comfyAppStore";
import { toast } from "@/presentation/stores/toastStore";
import { PaletteColorPickerPopover } from "./PaletteColorPickerPopover";

function swatchBackground(hex: string): string {
  return `
    linear-gradient(#${hex}, #${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

interface PickerTarget {
  index: number;
  rect: DOMRect;
}

export function PaletteField({
  value,
  disabled,
  onChange,
}: {
  value: PaletteRunnerValue;
  disabled: boolean;
  onChange: (value: PaletteRunnerValue) => void;
}) {
  const palettePresetLibrary = useAppStore((s) => s.palettePresetLibrary);
  const presets = useMemo(
    () => listPalettePresets(palettePresetLibrary),
    [palettePresetLibrary],
  );

  const colors = value.colors;
  const [removeMode, setRemoveMode] = useState(false);
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [presetMenuPos, setPresetMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const presetButtonRef = useRef<HTMLButtonElement>(null);

  // 始终持有最新颜色数组，供右键拖拽刷选时连续提交，避免闭包读到过期数据
  const colorsRef = useRef(colors);
  colorsRef.current = colors;
  // 右键拖拽刷选会话：targetDisabled 为本次拖拽要统一设置的禁用状态
  const rightDragRef = useRef<{ targetDisabled: boolean } | null>(null);

  const enabledCount = colors.filter((c) => !c.disabled).length;

  const commit = (next: PaletteColorItem[]) => {
    colorsRef.current = next;
    onChange({ kind: "palette", colors: next });
  };

  const setHexAt = (index: number, hex: string) => {
    commit(colors.map((item, i) => (i === index ? { ...item, hex } : item)));
  };

  const setDisabledAt = (index: number, targetDisabled: boolean) => {
    const current = colorsRef.current;
    const item = current[index];
    if (!item || item.disabled === targetDisabled) return;
    commit(current.map((c, i) => (i === index ? { ...c, disabled: targetDisabled } : c)));
  };

  const removeAt = (index: number) => {
    commit(colors.filter((_, i) => i !== index));
  };

  // 右键松开（任意位置）结束拖拽刷选
  useEffect(() => {
    const endDrag = () => {
      rightDragRef.current = null;
    };
    window.addEventListener("mouseup", endDrag);
    return () => window.removeEventListener("mouseup", endDrag);
  }, []);

  const handleSwatchMouseDown = (e: React.MouseEvent, index: number) => {
    if (e.button !== 2) return;
    if (removeMode || disabled) return;
    const item = colorsRef.current[index];
    if (!item) return;
    const targetDisabled = !item.disabled;
    rightDragRef.current = { targetDisabled };
    setDisabledAt(index, targetDisabled);
  };

  const handleSwatchMouseEnter = (index: number) => {
    const drag = rightDragRef.current;
    if (!drag || removeMode || disabled) return;
    setDisabledAt(index, drag.targetDisabled);
  };

  const replaceColors = (items: PaletteColorItem[]) => {
    setPicker(null);
    commit(items);
  };

  const handleAddColor = () => {
    if (disabled) return;
    const index = colors.length;
    commit([...colors, { hex: DEFAULT_PALETTE_HEX, disabled: false }]);
    const rect = addButtonRef.current?.getBoundingClientRect();
    if (rect) setPicker({ index, rect });
  };

  const handleImportPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    if (preset.colors.length === 0) {
      toast.info("该预设为空");
      return;
    }
    replaceColors(colorEntriesToPaletteItems(preset.colors));
    toast.info(`已导入预设「${preset.name}」`);
  };

  const handleImportHexFile = async () => {
    if (disabled || busy) return;
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "调色板文件", extensions: ["hex", "txt"] }],
    });
    if (!selected || typeof selected !== "string") return;
    setBusy(true);
    try {
      const text = await readTextFile(selected);
      const items = parseHexText(text);
      if (items.length === 0) {
        toast.error("未从文件中解析到有效颜色");
        return;
      }
      replaceColors(items);
      toast.info(`已从 .hex 文件导入 ${items.length} 个颜色`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "读取 .hex 文件失败");
    } finally {
      setBusy(false);
    }
  };

  const handleImportImage = async () => {
    if (disabled || busy) return;
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "图片", extensions: ["png", "jpg", "jpeg", "webp", "bmp", "gif"] }],
    });
    if (!selected || typeof selected !== "string") return;
    setBusy(true);
    try {
      const bytes = await readFile(selected);
      const imageData = await decodeImageBlobToImageData(new Blob([bytes as BlobPart]));
      const items = imageDataToPaletteItems(imageData);
      if (items.length === 0) {
        toast.error("未能从图片中取到颜色");
        return;
      }
      replaceColors(items);
      toast.info(`已从图片取色 ${items.length} 个`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "图片取色失败");
    } finally {
      setBusy(false);
    }
  };

  const presetMenuItems: MenuItem[] =
    presets.length === 0
      ? [
          {
            type: "action",
            label: "（暂无色板预设）",
            onClick: () => setPresetMenuPos(null),
            disabled: true,
          },
        ]
      : presets.map((preset) => ({
          type: "action",
          label: `${preset.name}（${preset.colors.length}）`,
          onClick: () => handleImportPreset(preset.id),
        }));

  const toolbarBtn =
    "shrink-0 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          ref={presetButtonRef}
          type="button"
          disabled={disabled}
          onClick={() => {
            const rect = presetButtonRef.current?.getBoundingClientRect();
            if (rect) setPresetMenuPos({ x: rect.left, y: rect.bottom + 2 });
          }}
          className={toolbarBtn}
        >
          导入预设
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void handleImportHexFile()}
          className={toolbarBtn}
        >
          .hex 文件
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void handleImportImage()}
          className={toolbarBtn}
        >
          从图片
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setRemoveMode((v) => !v)}
          className={`${toolbarBtn} ${
            removeMode ? "border-red-500 bg-red-950/40 text-red-300 hover:border-red-400" : ""
          }`}
        >
          {removeMode ? "退出移除" : "移除模式"}
        </button>
        <span className="ml-auto text-[11px] text-zinc-500">
          {enabledCount}/{colors.length} 色
        </span>
      </div>

      {colors.length === 0 ? (
        <div className="flex h-16 items-center justify-center rounded border border-dashed border-zinc-700 bg-zinc-900 text-[11px] text-zinc-600">
          暂无颜色，点击「新增」或从预设/文件/图片导入
        </div>
      ) : null}

      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(1.5rem,1fr))] gap-1"
        onContextMenu={(e) => e.preventDefault()}
      >
        {colors.map((item, index) => {
          const tooltip = removeMode
            ? `#${item.hex}\n点击移除该颜色`
            : `#${item.hex}${item.disabled ? "（已禁用）" : ""}\n双击修改颜色，右键${
                item.disabled ? "启用" : "禁用"
              }（可按住右键拖拽刷选）`;
          return (
            <button
              key={`${index}-${item.hex}`}
              type="button"
              title={tooltip}
              disabled={disabled}
              onClick={(e) => {
                if (removeMode) {
                  removeAt(index);
                  return;
                }
                // 单击不触发改色，避免误操作；改色用双击
                e.preventDefault();
              }}
              onDoubleClick={(e) => {
                if (removeMode || disabled) return;
                setPicker({ index, rect: e.currentTarget.getBoundingClientRect() });
              }}
              onMouseDown={(e) => handleSwatchMouseDown(e, index)}
              onMouseEnter={() => handleSwatchMouseEnter(index)}
              className={`relative aspect-square min-h-[1.5rem] w-full rounded-sm border transition hover:ring-1 hover:ring-zinc-500/50 ${
                removeMode
                  ? "border-red-500/60 hover:border-red-400"
                  : item.disabled
                    ? "border-zinc-700"
                    : "border-zinc-600"
              } disabled:cursor-not-allowed`}
              style={{ background: swatchBackground(item.hex), opacity: item.disabled ? 0.35 : 1 }}
            >
              {item.disabled && !removeMode && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white drop-shadow">
                  ✕
                </span>
              )}
              {removeMode && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-bold text-red-200 drop-shadow">
                  −
                </span>
              )}
            </button>
          );
        })}

        {!removeMode && (
          <button
            ref={addButtonRef}
            type="button"
            title="在末尾新增颜色"
            disabled={disabled}
            onClick={handleAddColor}
            className="flex aspect-square min-h-[1.5rem] w-full items-center justify-center rounded-sm border border-dashed border-zinc-600 text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            +
          </button>
        )}
      </div>

      {presetMenuPos && (
        <ContextMenu
          position={presetMenuPos}
          items={presetMenuItems}
          onClose={() => setPresetMenuPos(null)}
        />
      )}

      {picker && colors[picker.index] && (
        <PaletteColorPickerPopover
          anchorRect={picker.rect}
          currentColor={fromHex(`#${colors[picker.index].hex}`)}
          onChange={(color) => setHexAt(picker.index, pixelColorToHexValue(color))}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
