import type { AppComponent } from "@/domain/comfyApp/ComfyAppComponent";
import { useBackdropDismiss } from "@/presentation/hooks/useBackdropDismiss";
import { useComfyAppStore, type RunnerComponentValue } from "@/presentation/stores/comfyAppStore";
import { AiTextField } from "../aiTextField/AiTextField";
import { ComfyProgressBar } from "./ComfyProgressBar";
import { ComfyResultGallery } from "./ComfyResultGallery";
import { RatioSizeField } from "./components/RatioSizeField";
import { ImageUploadField } from "./components/ImageUploadField";
import { PaletteField } from "./components/PaletteField";
import { PromptField } from "./components/PromptField";
import { ParameterPresetBar } from "./components/ParameterPresetBar";

function RunnerComponent({
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
    return <RatioSizeField component={component} value={value} disabled={disabled} onChange={onChange} />;
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

export function ComfyAppRunnerModal() {
  const app = useComfyAppStore((s) => s.runnerApp);
  const values = useComfyAppStore((s) => s.runnerValues);
  const running = useComfyAppStore((s) => s.runnerRunning);
  const progress = useComfyAppStore((s) => s.runnerProgress);
  const results = useComfyAppStore((s) => s.runnerResults);
  const runnerWorkflow = useComfyAppStore((s) => s.runnerWorkflow);
  const error = useComfyAppStore((s) => s.runnerError);
  const setRunnerValue = useComfyAppStore((s) => s.setRunnerValue);
  const runApp = useComfyAppStore((s) => s.runApp);
  const abortRunner = useComfyAppStore((s) => s.abortRunner);
  const closeRunner = useComfyAppStore((s) => s.closeRunner);

  const backdropProps = useBackdropDismiss<HTMLDivElement>(closeRunner);

  if (!app) return null;

  const sortedComponents = [...app.components].sort((a, b) => a.order - b.order);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      {...backdropProps}
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-zinc-100">{app.name}</h2>
            {app.description && (
              <p className="truncate text-[11px] text-zinc-500">{app.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={closeRunner}
            className="rounded px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            关闭
          </button>
        </header>

        <div className="shrink-0 border-b border-zinc-800 px-4 py-2">
          <ParameterPresetBar disabled={running} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-3 rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {sortedComponents.map((component) => (
              <div key={component.id} className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">{component.label}</label>
                <RunnerComponent
                  appId={app.id}
                  component={component}
                  value={values[component.id]}
                  disabled={running}
                  onChange={(value) => setRunnerValue(component.id, value)}
                />
              </div>
            ))}
          </div>

          {(progress.status !== "idle" || running) && (
            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                进度
              </h3>
              <ComfyProgressBar progress={progress} />
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                结果
              </h3>
              <ComfyResultGallery results={results} workflow={runnerWorkflow} />
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-800 px-4 py-3">
          {running ? (
            <button
              type="button"
              onClick={abortRunner}
              className="rounded bg-red-700 px-5 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
            >
              停止
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void runApp()}
              className="rounded bg-blue-600 px-5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
            >
              生成
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
