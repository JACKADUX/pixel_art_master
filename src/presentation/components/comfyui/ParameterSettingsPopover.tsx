import { useMemo, useState } from "react";
import type { ComfyParameter } from "@/domain/comfyui/ComfyParameter";
import {
  availableComponentTypesFor,
  componentTypeLabel,
  DEFAULT_RATIO_SIZE_CONFIG,
  type AppComponent,
  type AppComponentType,
} from "@/domain/comfyApp/ComfyAppComponent";
import { ASPECT_RATIO_PRESETS } from "@/domain/comfyApp/RatioSize";
import { useBackdropDismiss } from "@/presentation/hooks/useBackdropDismiss";
import { useComfyAppStore } from "@/presentation/stores/comfyAppStore";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `component-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ParameterSettingsPopover({
  parameter,
  allParameters,
  onClose,
}: {
  parameter: ComfyParameter;
  allParameters: ComfyParameter[];
  onClose: () => void;
}) {
  const existing = useComfyAppStore((s) => s.findComponentByParameter(parameter.id));
  const upsertComponent = useComfyAppStore((s) => s.upsertComponent);
  const removeComponentByParameter = useComfyAppStore((s) => s.removeComponentByParameter);

  const typeOptions = useMemo(
    () => availableComponentTypesFor(parameter.type),
    [parameter.type],
  );

  // 同节点外的其它数值参数，供宽高比例组件配对
  const otherNumberParameters = useMemo(
    () =>
      allParameters.filter((p) => p.type === "number" && p.id !== parameter.id),
    [allParameters, parameter.id],
  );

  const [exposed, setExposed] = useState<boolean>(Boolean(existing));
  const [label, setLabel] = useState<string>(existing?.label || parameter.inputKey);
  const [componentType, setComponentType] = useState<AppComponentType>(
    existing?.type ?? typeOptions[0],
  );
  const [isPrompt, setIsPrompt] = useState<boolean>(existing?.isPrompt ?? false);

  // ratioSize 配对状态
  const initialIsWidth = existing?.widthParameterId === parameter.id || !existing?.heightParameterId;
  const [thisIsWidth, setThisIsWidth] = useState<boolean>(initialIsWidth);
  const [pairedParameterId, setPairedParameterId] = useState<string>(
    existing
      ? existing.widthParameterId === parameter.id
        ? existing.heightParameterId ?? ""
        : existing.widthParameterId ?? ""
      : otherNumberParameters[0]?.id ?? "",
  );
  const ratioConfig = existing?.ratio ?? DEFAULT_RATIO_SIZE_CONFIG;
  const [defaultRatioId, setDefaultRatioId] = useState<string>(ratioConfig.defaultRatioId);
  const [defaultMaxEdge, setDefaultMaxEdge] = useState<number>(ratioConfig.defaultMaxEdge);
  const [step, setStep] = useState<number>(ratioConfig.step);

  const backdropProps = useBackdropDismiss<HTMLDivElement>(onClose);

  const handleSave = () => {
    if (!exposed) {
      removeComponentByParameter(parameter.id);
      onClose();
      return;
    }

    const componentId = existing?.id ?? randomId();
    const order = existing?.order ?? Date.now();

    if (componentType === "ratioSize") {
      if (!pairedParameterId) return;
      const widthParameterId = thisIsWidth ? parameter.id : pairedParameterId;
      const heightParameterId = thisIsWidth ? pairedParameterId : parameter.id;
      // 清理配对参数上可能已存在的其它组件，避免冲突
      removeComponentByParameter(pairedParameterId);
      const component: AppComponent = {
        id: componentId,
        type: "ratioSize",
        label: label.trim() || "尺寸",
        order,
        widthParameterId,
        heightParameterId,
        ratio: {
          defaultRatioId,
          defaultMaxEdge: Math.max(1, Math.round(defaultMaxEdge)),
          step: Math.max(1, Math.round(step)),
        },
      };
      upsertComponent(component);
    } else {
      const component: AppComponent = {
        id: componentId,
        type: componentType,
        label: label.trim() || parameter.inputKey,
        order,
        parameterId: parameter.id,
      };
      if ((componentType === "text" || componentType === "aiText") && isPrompt) {
        component.isPrompt = true;
      }
      upsertComponent(component);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      {...backdropProps}
    >
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-zinc-100">参数设置</h3>
          <p className="text-[11px] text-zinc-500">
            {parameter.nodeTitle} · <span className="font-mono">{parameter.inputKey}</span>
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={exposed}
            onChange={(e) => setExposed(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          提取为应用参数
        </label>

        {exposed && (
          <div className="space-y-3 border-t border-zinc-800 pt-3">
            <label className="block space-y-1 text-xs text-zinc-400">
              <span>展示名称</span>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1 text-xs text-zinc-400">
              <span>组件类型</span>
              <select
                value={componentType}
                onChange={(e) => setComponentType(e.target.value as AppComponentType)}
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 outline-none focus:border-blue-500"
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {componentTypeLabel(type)}
                  </option>
                ))}
              </select>
            </label>

            {(componentType === "text" || componentType === "aiText") && (
              <label
                className="flex items-center gap-2 text-xs text-zinc-300"
                title="开启后，运行时在输入框外挂载提示词组件，可管理快捷提示词并合并到输入末尾"
              >
                <input
                  type="checkbox"
                  checked={isPrompt}
                  onChange={(e) => setIsPrompt(e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                作为提示词
              </label>
            )}

            {componentType === "ratioSize" && (
              <div className="space-y-3 rounded border border-zinc-800 bg-zinc-950/50 p-2.5">
                {otherNumberParameters.length === 0 ? (
                  <p className="text-[11px] text-amber-400">
                    宽高比例组件需要另一个数值参数配对，但未找到其它数值参数。
                  </p>
                ) : (
                  <>
                    <label className="block space-y-1 text-xs text-zinc-400">
                      <span>配对参数（另一维度）</span>
                      <select
                        value={pairedParameterId}
                        onChange={(e) => setPairedParameterId(e.target.value)}
                        className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 outline-none focus:border-blue-500"
                      >
                        {otherNumberParameters.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nodeTitle} · {p.inputKey}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span>本参数为</span>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={thisIsWidth}
                          onChange={() => setThisIsWidth(true)}
                        />
                        宽
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={!thisIsWidth}
                          onChange={() => setThisIsWidth(false)}
                        />
                        高
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="block space-y-1 text-xs text-zinc-400">
                        <span>默认比例</span>
                        <select
                          value={defaultRatioId}
                          onChange={(e) => setDefaultRatioId(e.target.value)}
                          className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 outline-none focus:border-blue-500"
                        >
                          {ASPECT_RATIO_PRESETS.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                              {preset.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block space-y-1 text-xs text-zinc-400">
                        <span>默认最大边</span>
                        <input
                          type="number"
                          value={defaultMaxEdge}
                          onChange={(e) => setDefaultMaxEdge(Number(e.target.value) || 0)}
                          className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 outline-none focus:border-blue-500"
                        />
                      </label>
                    </div>
                    <label className="block space-y-1 text-xs text-zinc-400">
                      <span>对齐步长</span>
                      <input
                        type="number"
                        value={step}
                        onChange={(e) => setStep(Number(e.target.value) || 1)}
                        className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 outline-none focus:border-blue-500"
                      />
                    </label>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-zinc-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={exposed && componentType === "ratioSize" && !pairedParameterId}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
