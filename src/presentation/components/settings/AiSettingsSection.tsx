import { useState } from "react";
import { testLlmConnection } from "@/application/use-cases/TestLlmConnection";
import {
  LLM_PROVIDER_IDS,
  LLM_PROVIDER_LABELS,
  providerRequiresApiKey,
} from "@/domain/llm/LlmProvider";
import {
  MAX_LLM_TIMEOUT_MS,
  MIN_LLM_TIMEOUT_MS,
} from "@/domain/llm/LlmSettings";
import { llmClient } from "@/infrastructure/llm/createLlmClient";
import { useAppStore } from "../../stores/appStore";
import { toast } from "../../stores/toastStore";
import {
  SettingsGroup,
  SettingsNumberInput,
  SettingsRow,
  SettingsTextInput,
} from "./SettingsField";

export function AiSettingsSection() {
  const llmSettings = useAppStore((s) => s.llmSettings);
  const setLlmProvider = useAppStore((s) => s.setLlmProvider);
  const setLlmApiKey = useAppStore((s) => s.setLlmApiKey);
  const setLlmBaseUrl = useAppStore((s) => s.setLlmBaseUrl);
  const setLlmModel = useAppStore((s) => s.setLlmModel);
  const setLlmTimeoutSeconds = useAppStore((s) => s.setLlmTimeoutSeconds);

  const [testing, setTesting] = useState(false);

  const timeoutSeconds = Math.round(llmSettings.timeoutMs / 1000);
  const minTimeoutSeconds = Math.ceil(MIN_LLM_TIMEOUT_MS / 1000);
  const maxTimeoutSeconds = Math.floor(MAX_LLM_TIMEOUT_MS / 1000);
  const needsApiKey = providerRequiresApiKey(llmSettings.provider);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await testLlmConnection(llmClient, llmSettings);
      if (result.ok) {
        toast.info("连接成功");
      } else {
        toast.error(result.message);
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <SettingsGroup
        title="LLM 提供商"
        description="支持 DeepSeek、OpenRouter 与本地 Ollama（OpenAI 兼容接口）。"
      >
        <SettingsRow label="提供商">
          <select
            value={llmSettings.provider}
            onChange={(e) => setLlmProvider(e.target.value as typeof llmSettings.provider)}
            className="h-8 min-w-[10rem] rounded border border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-100 outline-none focus:border-blue-500"
          >
            {LLM_PROVIDER_IDS.map((id) => (
              <option key={id} value={id}>
                {LLM_PROVIDER_LABELS[id]}
              </option>
            ))}
          </select>
        </SettingsRow>

        <SettingsRow
          label="API Key"
          hint={needsApiKey ? "保存在本地，仅用于连接 LLM 服务" : "Ollama 本地服务无需 API Key"}
        >
          <SettingsTextInput
            type="password"
            value={llmSettings.apiKey}
            onChange={setLlmApiKey}
            placeholder={needsApiKey ? "sk-..." : "无需填写"}
            disabled={!needsApiKey}
          />
        </SettingsRow>

        <SettingsRow
          label="Base URL"
          hint={
            llmSettings.provider === "ollama"
              ? "默认 http://127.0.0.1:11434/v1，可按需修改端口"
              : "OpenAI 兼容 API 根路径，不含 /chat/completions"
          }
        >
          <SettingsTextInput
            value={llmSettings.baseUrl}
            onChange={setLlmBaseUrl}
            placeholder="https://api.example.com/v1"
          />
        </SettingsRow>

        <SettingsRow label="模型名称" hint="如 deepseek-chat、anthropic/claude-3.5-sonnet、llama3.2">
          <SettingsTextInput
            value={llmSettings.model}
            onChange={setLlmModel}
            placeholder="model-name"
          />
        </SettingsRow>

        <SettingsRow
          label="请求超时"
          hint={`${minTimeoutSeconds}–${maxTimeoutSeconds} 秒`}
        >
          <SettingsNumberInput
            value={timeoutSeconds}
            min={minTimeoutSeconds}
            max={maxTimeoutSeconds}
            suffix="秒"
            onChange={setLlmTimeoutSeconds}
          />
        </SettingsRow>

        <div className="pt-1">
          <button
            type="button"
            disabled={testing}
            onClick={() => void handleTestConnection()}
            className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testing ? "测试中…" : "测试连接"}
          </button>
        </div>
      </SettingsGroup>
    </div>
  );
}
