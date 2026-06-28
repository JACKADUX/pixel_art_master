import { useRef, useState } from "react";
import { DEFAULT_RATIO_SIZE_CONFIG, type AppComponent } from "@/domain/comfyApp/ComfyAppComponent";
import {
  ASPECT_RATIO_PRESETS,
  computeRatioSize,
  findAspectRatioPreset,
  FREE_RATIO_ID,
} from "@/domain/comfyApp/RatioSize";
import { ContextMenu } from "@/presentation/components/ContextMenu";
import type { MenuItem } from "@/presentation/components/MenuDropdown";
import type { RatioRunnerValue } from "@/presentation/stores/comfyAppStore";

export function RatioSizeField({
  component,
  value,
  disabled,
  onChange,
}: {
  component: AppComponent;
  value: RatioRunnerValue;
  disabled: boolean;
  onChange: (value: RatioRunnerValue) => void;
}) {
  const config = component.ratio ?? DEFAULT_RATIO_SIZE_CONFIG;
  const isFree = value.ratioId === FREE_RATIO_ID;
  const preset = findAspectRatioPreset(value.ratioId);
  const currentLabel = isFree ? "自由" : (preset?.label ?? value.ratioId);

  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const selectFree = () => {
    const size = computeRatioSize(
      preset ? { w: preset.w, h: preset.h } : { w: 1, h: 1 },
      value.maxEdge,
      value.orientation,
      config.step,
    );
    onChange({
      ...value,
      ratioId: FREE_RATIO_ID,
      width: value.width ?? size.width,
      height: value.height ?? size.height,
    });
  };

  const menuItems: MenuItem[] = [
    ...ASPECT_RATIO_PRESETS.map<MenuItem>((p) => ({
      type: "toggle",
      label: p.label,
      checked: value.ratioId === p.id,
      onClick: () => onChange({ ...value, ratioId: p.id }),
    })),
    { type: "toggle", label: "自由", checked: isFree, onClick: selectFree },
  ];
  if (!isFree) {
    menuItems.push(
      { type: "separator" },
      {
        type: "action",
        label: value.orientation === "landscape" ? "切换为竖向" : "切换为横向",
        onClick: () =>
          onChange({
            ...value,
            orientation: value.orientation === "landscape" ? "portrait" : "landscape",
          }),
      },
    );
  }

  const numberInput =
    "min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-blue-500 disabled:opacity-50";

  return (
    <div className="flex items-center gap-2">
      {isFree ? (
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <input
            type="number"
            title="宽"
            value={value.width ?? ""}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, width: Number(e.target.value) || 0 })}
            className={numberInput}
          />
          <span className="shrink-0 text-[11px] text-zinc-500">×</span>
          <input
            type="number"
            title="高"
            value={value.height ?? ""}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, height: Number(e.target.value) || 0 })}
            className={numberInput}
          />
        </div>
      ) : (
        <input
          type="number"
          title="最大边"
          value={value.maxEdge}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, maxEdge: Number(e.target.value) || 0 })}
          className={numberInput}
        />
      )}

      <button
        ref={moreButtonRef}
        type="button"
        disabled={disabled}
        title="选择比例 / 自由宽高"
        aria-haspopup="menu"
        aria-expanded={menuPos !== null}
        onClick={() => {
          const rect = moreButtonRef.current?.getBoundingClientRect();
          if (rect) setMenuPos({ x: rect.right, y: rect.bottom + 2 });
        }}
        className="flex shrink-0 items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
      >
        <span>{currentLabel}</span>
        {!isFree && (
          <span className="text-zinc-500">{value.orientation === "landscape" ? "横" : "竖"}</span>
        )}
        <span className="text-zinc-500">▾</span>
      </button>

      {menuPos && (
        <ContextMenu position={menuPos} items={menuItems} onClose={() => setMenuPos(null)} />
      )}
    </div>
  );
}
