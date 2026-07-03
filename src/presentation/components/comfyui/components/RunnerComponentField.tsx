import type { AppComponent } from "@/domain/comfyApp/ComfyAppComponent";
import type { RunnerComponentValue } from "@/presentation/stores/comfyAppStore";
import { AiTextField } from "../../aiTextField/AiTextField";
import { RatioSizeField } from "./RatioSizeField";
import { ImageUploadField } from "./ImageUploadField";
import { PaletteField } from "./PaletteField";
import { PromptField } from "./PromptField";

/**
 * 运行窗口里单个应用组件的输入控件，按组件类型渲染对应字段。
 * 被运行弹窗与画布悬浮窗共用。
 */
export function RunnerComponentField({
  appId,
  component,
  value,
  disabled,
  onChange,
}: {
  appId: string;
  component: AppComponent;
  value: RunnerComponentValue | undefined;
  disabled: boolean;
  onChange: (value: RunnerComponentValue) => void;
}) {
  if (component.type === "ratioSize" && value?.kind === "ratio") {
    return (
      <RatioSizeField component={component} value={value} disabled={disabled} onChange={onChange} />
    );
  }

  if (component.type === "imageUpload" && value?.kind === "image") {
    return <ImageUploadField component={component} value={value} disabled={disabled} />;
  }

  if (component.type === "palette" && value?.kind === "palette") {
    return <PaletteField value={value} disabled={disabled} onChange={onChange} />;
  }

  if (component.type === "boolean" && value?.kind === "scalar") {
    return (
      <label className="flex items-center gap-2 text-xs text-zinc-300">
        <input
          type="checkbox"
          checked={Boolean(value.value)}
          disabled={disabled}
          onChange={(e) => onChange({ kind: "scalar", value: e.target.checked })}
          className="h-3.5 w-3.5"
        />
        启用
      </label>
    );
  }

  if (component.type === "number" && value?.kind === "scalar") {
    return (
      <input
        type="number"
        value={Number(value.value)}
        disabled={disabled}
        onChange={(e) =>
          onChange({ kind: "scalar", value: e.target.value === "" ? 0 : Number(e.target.value) })
        }
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-blue-500 disabled:opacity-50"
      />
    );
  }

  if (component.type === "randomNumber" && value?.kind === "randomNumber") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value.value}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              ...value,
              value: e.target.value === "" ? 0 : Math.floor(Number(e.target.value)),
            })
          }
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <label
          className="flex shrink-0 items-center gap-1 text-[11px] text-zinc-400"
          title="开启后，每次点击生成并发送任务后，自动用随机正整数覆盖当前值"
        >
          <input
            type="checkbox"
            checked={value.randomEnabled}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, randomEnabled: e.target.checked })}
            className="h-3.5 w-3.5"
          />
          随机
        </label>
      </div>
    );
  }

  if (
    (component.type === "text" || component.type === "aiText") &&
    component.isPrompt &&
    value?.kind === "prompt"
  ) {
    return (
      <PromptField
        appId={appId}
        component={component}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (component.type === "aiText" && value?.kind === "scalar") {
    return (
      <AiTextField
        fieldId={`comfyapp.${appId}.${component.id}`}
        label={component.label}
        value={String(value.value)}
        onChange={(val) => onChange({ kind: "scalar", value: val })}
        multiline
        rows={3}
      />
    );
  }

  // text 及兜底
  if (value?.kind === "scalar") {
    return (
      <textarea
        value={String(value.value)}
        disabled={disabled}
        rows={2}
        onChange={(e) => onChange({ kind: "scalar", value: e.target.value })}
        className="w-full resize-y rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-blue-500 disabled:opacity-50"
      />
    );
  }

  return null;
}
