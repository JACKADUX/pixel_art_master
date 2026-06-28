import { useEffect } from "react";
import { createPortal } from "react-dom";
import { resolveActiveLlmSettings } from "@/domain/llm/LlmSettings";
import {
  DEEPSEEK_MODEL_LABELS,
  DEEPSEEK_MODELS,
  GENERATION_PRESETS,
  MAX_TOKENS_MAX,
  MAX_TOKENS_MIN,
  matchGenerationPreset,
  TEMPERATURE_MAX,
  TEMPERATURE_MIN,
  THINKING_EFFORTS,
  THINKING_EFFORT_LABELS,
  TOP_P_MAX,
  TOP_P_MIN,
  type DeepSeekModel,
  type ThinkingEffort,
} from "@/domain/world/WorldAgentSettings";
import { useBackdropDismiss } from "@/presentation/hooks/useBackdropDismiss";
import { useAppStore } from "../../stores/appStore";
import { useWorldAgentSettingsStore } from "../../stores/worldAgentSettingsStore";
import {
  SettingsGroup,
  SettingsNumberInput,
  SettingsRow,
  SettingsToggle,
} from "../settings/SettingsField";

const selectClassName =
  "h-8 min-w-[12rem] rounded border border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-100 outline-none focus:border-blue-500";

export function WorldAgentSettingsModal() {
  const open = useWorldAgentSettingsStore((s) => s.modalOpen);
  const closeModal = useWorldAgentSettingsStore((s) => s.closeModal);

  const model = useWorldAgentSettingsStore((s) => s.model);
  const temperature = useWorldAgentSettingsStore((s) => s.temperature);
  const topP = useWorldAgentSettingsStore((s) => s.topP);
  const maxTokens = useWorldAgentSettingsStore((s) => s.maxTokens);
  const thinkingEnabled = useWorldAgentSettingsStore((s) => s.thinkingEnabled);
  const thinkingEffort = useWorldAgentSettingsStore((s) => s.thinkingEffort);

  const setModel = useWorldAgentSettingsStore((s) => s.setModel);
  const setTemperature = useWorldAgentSettingsStore((s) => s.setTemperature);
  const setTopP = useWorldAgentSettingsStore((s) => s.setTopP);
  const setSampling = useWorldAgentSettingsStore((s) => s.setSampling);
  const setMaxTokens = useWorldAgentSettingsStore((s) => s.setMaxTokens);
  const setThinkingEnabled = useWorldAgentSettingsStore((s) => s.setThinkingEnabled);
  const setThinkingEffort = useWorldAgentSettingsStore((s) => s.setThinkingEffort);

  const llmSettingsStore = useAppStore((s) => s.llmSettingsStore);
  const openSettingsModal = useAppStore((s) => s.openSettingsModal);
  const llmSettings = resolveActiveLlmSettings(llmSettingsStore);
  const apiKeyConfigured = llmSettings.apiKey.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, closeModal]);

  const backdropProps = useBackdropDismiss<HTMLDivElement>(closeModal);

  if (!open) return null;

  const activePresetId = matchGenerationPreset(temperature, topP);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
      {...backdropProps}
    >
      <div className="flex max-h-[90vh] w-[34rem] max-w-[94vw] flex-col rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-700 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Agent 设置</h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              DeepSeek 模型参数，修改后自动保存。
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            关闭
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto p-5">
          <SettingsGroup
            title="API 凭据"
            description="API Key 复用全局设置（AI），此处不单独配置。"
          >
            <SettingsRow
              label="DeepSeek API Key"
              hint={apiKeyConfigured ? "已在全局设置中配置" : "尚未配置，生成功能将不可用"}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs ${apiKeyConfigured ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {apiKeyConfigured ? "已配置" : "未配置"}
                </span>
                <button
                  type="button"
                  onClick={openSettingsModal}
                  className="rounded bg-zinc-700 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-600"
                >
                  前往设置
                </button>
              </div>
            </SettingsRow>
          </SettingsGroup>

          <SettingsGroup title="模型" description="Flash 偏向速度，Pro 偏向能力。">
            <SettingsRow label="模型">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as DeepSeekModel)}
                className={selectClassName}
              >
                {DEEPSEEK_MODELS.map((id) => (
                  <option key={id} value={id}>
                    {DEEPSEEK_MODEL_LABELS[id]}
                  </option>
                ))}
              </select>
            </SettingsRow>
          </SettingsGroup>

          <SettingsGroup title="生成参数" description="控制输出的随机性与长度。">
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-500">快捷预设（一键套用温度与 Top-p）</span>
              <div className="flex flex-wrap gap-1.5">
                {GENERATION_PRESETS.map((preset) => {
                  const active = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      title={`${preset.description}（temp=${preset.temperature}, top_p=${preset.topP}）`}
                      onClick={() => setSampling(preset.temperature, preset.topP)}
                      className={`rounded px-2.5 py-1 text-xs transition ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <SettingsRow
              label="温度"
              hint={`${TEMPERATURE_MIN} – ${TEMPERATURE_MAX}，越高越发散`}
            >
              <SettingsNumberInput
                value={temperature}
                min={TEMPERATURE_MIN}
                max={TEMPERATURE_MAX}
                step={0.1}
                onChange={setTemperature}
              />
            </SettingsRow>
            <SettingsRow label="Top P" hint={`${TOP_P_MIN} – ${TOP_P_MAX}，核采样阈值`}>
              <SettingsNumberInput
                value={topP}
                min={TOP_P_MIN}
                max={TOP_P_MAX}
                step={0.05}
                onChange={setTopP}
              />
            </SettingsRow>
            <SettingsRow label="最大输出 Token" hint={`${MAX_TOKENS_MIN} – ${MAX_TOKENS_MAX}`}>
              <SettingsNumberInput
                value={maxTokens}
                min={MAX_TOKENS_MIN}
                max={MAX_TOKENS_MAX}
                step={128}
                onChange={setMaxTokens}
              />
            </SettingsRow>
          </SettingsGroup>

          <SettingsGroup title="思考" description="是否让模型在回答前进行思考推理。">
            <SettingsToggle
              label="开启思考"
              hint="附加思考过程，质量更高但更慢"
              checked={thinkingEnabled}
              onChange={setThinkingEnabled}
            />
            <SettingsRow label="思考程度" hint="思考的深入程度">
              <select
                value={thinkingEffort}
                onChange={(e) => setThinkingEffort(e.target.value as ThinkingEffort)}
                disabled={!thinkingEnabled}
                className={`${selectClassName} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {THINKING_EFFORTS.map((effort) => (
                  <option key={effort} value={effort}>
                    {THINKING_EFFORT_LABELS[effort]}
                  </option>
                ))}
              </select>
            </SettingsRow>
          </SettingsGroup>
        </div>
      </div>
    </div>,
    document.body,
  );
}
