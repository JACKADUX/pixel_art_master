import { create } from "zustand";
import { saveAgentProfiles } from "@/application/use-cases/SaveAgentProfiles";
import { saveFieldPromptConfigs } from "@/application/use-cases/SaveFieldPromptConfigs";
import { agentProfileRepository } from "@/infrastructure/storage/FileAgentProfileRepository";
import { fieldPromptConfigRepository } from "@/infrastructure/storage/FileFieldPromptConfigRepository";
import { getActiveSoftwareDataPath } from "@/infrastructure/storage/UserDataPersistenceContext";
import {
  AgentProfile,
  BUILT_IN_AGENT_PROFILES,
  clampMaxTokens,
  clampTemperature,
  clampTopP,
  getBuiltInAgentProfile,
  type AgentProfileParams,
} from "@/domain/aiTextField/AgentProfile";
import { FieldPromptConfig, getFallbackFieldPromptConfig } from "@/domain/aiTextField/FieldPromptConfig";
import { renderPromptTemplate } from "@/domain/aiTextField/PromptTemplate";
import { useAiFieldRegistryStore } from "./aiFieldRegistryStore";
import { createChatMessage, ChatMessage } from "@/domain/llm/ChatMessage";
import { streamChatCompletion } from "@/application/use-cases/StreamChatCompletion";
import { llmClient } from "@/infrastructure/llm/createLlmClient";
import { validateLlmSettings, LlmSettings } from "@/domain/llm/LlmSettings";
import { llmErrorMessage, isLlmError } from "@/domain/llm/LlmError";

export type AiTextFieldTab = "config" | "chat";

export type AiGenerationStatus =
  | "idle"
  | "waiting"
  | "streaming"
  | "empty"
  | "error"
  | "aborted";

const EMPTY_RESULT_MESSAGE = "本次没有生成任何内容，可点击「重新生成」重试，或调整 Prompt / 参数后再试。";

export const AI_TEXT_FIELD_PANEL_DEFAULT_WIDTH = 480;
export const AI_TEXT_FIELD_PANEL_DEFAULT_HEIGHT = 580;
export const AI_TEXT_FIELD_PANEL_MIN_WIDTH = 360;
export const AI_TEXT_FIELD_PANEL_MIN_HEIGHT = 400;

interface FieldSessionState {
  selectedProfileId: string;
  promptTemplate: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  thinkingEnabled: boolean;
  thinkingEffort: "low" | "medium" | "high";
  messages: ChatMessage[];
  error: string | null;
}

interface AiTextFieldSessionStore {
  profiles: AgentProfile[];
  fieldConfigs: Record<string, FieldPromptConfig>;
  fieldSessions: Record<string, FieldSessionState>;

  isOpen: boolean;
  activeFieldId: string | null;
  activeFieldLabel: string;
  activeTab: AiTextFieldTab;

  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;

  selectedProfileId: string;
  promptTemplate: string;

  temperature: number;
  topP: number;
  maxTokens: number;
  thinkingEnabled: boolean;
  thinkingEffort: "low" | "medium" | "high";

  messages: ChatMessage[];
  streaming: boolean;
  streamingContent: string;
  generationStatus: AiGenerationStatus;
  error: string | null;
  abortController: AbortController | null;

  init: () => void;
  hydrateUserData: (
    profiles: AgentProfile[],
    fieldConfigs: Record<string, FieldPromptConfig>,
  ) => void;
  openSession: (fieldId: string, label: string, anchorRect: DOMRect) => void;
  closeSession: () => void;
  setActiveTab: (tab: AiTextFieldTab) => void;
  setPanelGeometry: (x: number, y: number, width?: number, height?: number) => void;

  setSelectedProfileId: (id: string) => void;
  setPromptTemplate: (template: string) => void;
  saveCurrentPromptAsDefault: () => void;

  setTemperature: (val: number) => void;
  setTopP: (val: number) => void;
  setMaxTokens: (val: number) => void;
  setThinkingEnabled: (val: boolean) => void;
  setThinkingEffort: (val: "low" | "medium" | "high") => void;
  resetSelectedProfileParams: () => void;

  startSession: (llmSettings: LlmSettings) => Promise<void>;
  sendFollowUp: (content: string, llmSettings: LlmSettings) => Promise<void>;
  regenerate: (llmSettings: LlmSettings) => Promise<void>;
  regenerateFrom: (messageId: string, llmSettings: LlmSettings) => Promise<void>;
  editMessage: (messageId: string, content: string) => void;
  abortStream: () => void;
  clearSessionMessages: () => void;

  applyToField: (mode: "replace" | "append", customText?: string) => void;
}

function msgIsAssistant(msg: ChatMessage): boolean {
  return msg.role === "assistant";
}

function buildFieldSessionState(state: AiTextFieldSessionStore): FieldSessionState {
  return {
    selectedProfileId: state.selectedProfileId,
    promptTemplate: state.promptTemplate,
    temperature: state.temperature,
    topP: state.topP,
    maxTokens: state.maxTokens,
    thinkingEnabled: state.thinkingEnabled,
    thinkingEffort: state.thinkingEffort,
    messages: state.messages,
    error: state.error,
  };
}

function resolveFieldConfig(
  fieldId: string,
  fieldConfigs: Record<string, FieldPromptConfig>,
): FieldPromptConfig {
  return fieldConfigs[fieldId] ?? getFallbackFieldPromptConfig(fieldId);
}

function resolveProfileForConfig(
  profiles: AgentProfile[],
  config: FieldPromptConfig,
): AgentProfile {
  return (
    profiles.find((p) => p.id === config.agentProfileId) ||
    profiles[0] ||
    BUILT_IN_AGENT_PROFILES[0]
  );
}

export function computeInitialPanelGeometry(anchorRect: DOMRect | null): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const width = AI_TEXT_FIELD_PANEL_DEFAULT_WIDTH;
  const height = AI_TEXT_FIELD_PANEL_DEFAULT_HEIGHT;
  const margin = 8;

  if (!anchorRect) {
    return {
      x: Math.max(16, (window.innerWidth - width) / 2),
      y: Math.max(16, (window.innerHeight - height) / 2),
      width,
      height,
    };
  }

  let left = anchorRect.right + margin;
  let top = anchorRect.top;

  if (left + width > window.innerWidth) {
    left = anchorRect.left - width - margin;
  }

  if (left < 0 || left + width > window.innerWidth) {
    left = Math.max(16, (window.innerWidth - width) / 2);
    top = Math.max(16, (window.innerHeight - height) / 2);
    return { x: left, y: top, width, height };
  }

  if (top + height > window.innerHeight) {
    top = window.innerHeight - height - 16;
  }
  if (top < 16) top = 16;

  return { x: left, y: top, width, height };
}

export function clampPanelGeometry(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } {
  const minW = AI_TEXT_FIELD_PANEL_MIN_WIDTH;
  const minH = AI_TEXT_FIELD_PANEL_MIN_HEIGHT;
  const maxW = window.innerWidth - 16;
  const maxH = window.innerHeight - 16;

  let nextWidth = Math.min(maxW, Math.max(minW, width));
  let nextHeight = Math.min(maxH, Math.max(minH, height));
  let nextX = x;
  let nextY = y;

  if (nextX + nextWidth > window.innerWidth - 8) {
    nextX = window.innerWidth - nextWidth - 8;
  }
  if (nextY + nextHeight > window.innerHeight - 8) {
    nextY = window.innerHeight - nextHeight - 8;
  }
  if (nextX < 8) nextX = 8;
  if (nextY < 8) nextY = 8;

  return { x: nextX, y: nextY, width: nextWidth, height: nextHeight };
}

let profileParamsSaveTimer: ReturnType<typeof setTimeout> | null = null;

function buildCurrentProfileParams(state: AiTextFieldSessionStore): AgentProfileParams {
  return {
    temperature: state.temperature,
    topP: state.topP,
    maxTokens: state.maxTokens,
    thinkingEnabled: state.thinkingEnabled,
    thinkingEffort: state.thinkingEffort,
  };
}

async function persistSelectedProfileParams(state: AiTextFieldSessionStore): Promise<AgentProfile[]> {
  const params = buildCurrentProfileParams(state);
  const nextProfiles = state.profiles.map((profile) =>
    profile.id === state.selectedProfileId ? { ...profile, ...params } : profile,
  );
  const softwareDataPath = getActiveSoftwareDataPath();
  if (softwareDataPath) {
    await saveAgentProfiles(agentProfileRepository, softwareDataPath, nextProfiles);
  }
  return nextProfiles;
}

export function toPanelState(geometry: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { panelX: number; panelY: number; panelWidth: number; panelHeight: number } {
  return {
    panelX: geometry.x,
    panelY: geometry.y,
    panelWidth: geometry.width,
    panelHeight: geometry.height,
  };
}

export const useAiTextFieldSessionStore = create<AiTextFieldSessionStore>((set, get) => {
  const scheduleProfileParamsSave = () => {
    if (profileParamsSaveTimer) clearTimeout(profileParamsSaveTimer);
    profileParamsSaveTimer = setTimeout(() => {
      void persistSelectedProfileParams(get()).then((profiles) => {
        set({ profiles });
        profileParamsSaveTimer = null;
      });
    }, 300);
  };

  const runAssistantStream = async (
    apiHistory: ChatMessage[],
    assistantMessageId: string,
    llmSettings: LlmSettings,
  ) => {
    const abortController = new AbortController();
    set({
      streaming: true,
      streamingContent: "",
      generationStatus: "waiting",
      error: null,
      abortController,
    });

    const generationOptions = {
      temperature: get().temperature,
      topP: get().topP,
      maxTokens: get().maxTokens,
      thinkingEnabled: get().thinkingEnabled,
      thinkingEffort: get().thinkingEffort,
    };

    let accumulated = "";
    try {
      for await (const chunk of streamChatCompletion(
        llmClient,
        llmSettings,
        apiHistory,
        generationOptions,
        abortController.signal,
      )) {
        accumulated += chunk;
        set({ streamingContent: accumulated, generationStatus: "streaming" });
      }

      const isEmpty = accumulated.trim() === "";
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, content: accumulated } : msg,
        ),
        streaming: false,
        streamingContent: "",
        generationStatus: isEmpty ? "empty" : "idle",
        abortController: null,
        error: isEmpty ? EMPTY_RESULT_MESSAGE : null,
      }));
    } catch (error) {
      const message = llmErrorMessage(error);
      const isAborted = isLlmError(error) && error.code === "aborted";

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: accumulated || (isAborted ? "（已停止）" : "") }
            : msg,
        ),
        streaming: false,
        streamingContent: "",
        generationStatus: isAborted ? "aborted" : "error",
        abortController: null,
        error: isAborted ? null : message,
      }));
    }
  };

  return {
  profiles: [],
  fieldConfigs: {},
  fieldSessions: {},

  isOpen: false,
  activeFieldId: null,
  activeFieldLabel: "",
  activeTab: "chat",

  panelX: 0,
  panelY: 0,
  panelWidth: AI_TEXT_FIELD_PANEL_DEFAULT_WIDTH,
  panelHeight: AI_TEXT_FIELD_PANEL_DEFAULT_HEIGHT,

  selectedProfileId: "expand",
  promptTemplate: "",

  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  thinkingEnabled: false,
  thinkingEffort: "medium",

  messages: [],
  streaming: false,
  streamingContent: "",
  generationStatus: "idle",
  error: null,
  abortController: null,

  init: () => {},

  hydrateUserData: (profiles, fieldConfigs) => set({ profiles, fieldConfigs }),

  openSession: (fieldId, label, anchorRect) => {
    const state = get();
    if (state.isOpen && state.activeFieldId === fieldId) return;

    get().abortStream();
    const wasOpen = state.isOpen;
    const currentFieldId = state.activeFieldId;

    if (get().profiles.length === 0) {
      get().init();
    }

    const refreshedState = get();

    let nextFieldSessions = { ...state.fieldSessions };
    if (wasOpen && currentFieldId) {
      nextFieldSessions[currentFieldId] = buildFieldSessionState(state);
    }

    const { profiles, fieldConfigs } = refreshedState;
    const config = resolveFieldConfig(fieldId, fieldConfigs);
    const profile = resolveProfileForConfig(profiles, config);
    const savedSession = nextFieldSessions[fieldId];

    const sessionValues = savedSession
      ? {
          selectedProfileId: savedSession.selectedProfileId,
          promptTemplate: savedSession.promptTemplate,
          temperature: savedSession.temperature,
          topP: savedSession.topP,
          maxTokens: savedSession.maxTokens,
          thinkingEnabled: savedSession.thinkingEnabled,
          thinkingEffort: savedSession.thinkingEffort,
          messages: savedSession.messages,
          error: savedSession.error,
        }
      : {
          selectedProfileId: profile.id,
          promptTemplate: config.promptTemplate,
          temperature: profile.temperature,
          topP: profile.topP,
          maxTokens: profile.maxTokens,
          thinkingEnabled: profile.thinkingEnabled,
          thinkingEffort: profile.thinkingEffort,
          messages: [],
          error: null,
        };

    const geometry = wasOpen
      ? {
          panelX: refreshedState.panelX,
          panelY: refreshedState.panelY,
          panelWidth: refreshedState.panelWidth,
          panelHeight: refreshedState.panelHeight,
        }
      : toPanelState(computeInitialPanelGeometry(anchorRect));

    set({
      isOpen: true,
      activeFieldId: fieldId,
      activeFieldLabel: label,
      fieldSessions: nextFieldSessions,
      streamingContent: "",
      generationStatus: "idle",
      abortController: null,
      streaming: false,
      ...sessionValues,
      ...geometry,
    });
  },

  closeSession: () => {
    const state = get();
    state.abortStream();

    let nextFieldSessions = { ...state.fieldSessions };
    if (state.activeFieldId) {
      nextFieldSessions[state.activeFieldId] = buildFieldSessionState(state);
    }

    set({
      isOpen: false,
      activeFieldId: null,
      fieldSessions: nextFieldSessions,
      messages: [],
      streamingContent: "",
      generationStatus: "idle",
      error: null,
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setPanelGeometry: (x, y, width, height) => {
    const state = get();
    const clamped = clampPanelGeometry(
      x,
      y,
      width ?? state.panelWidth,
      height ?? state.panelHeight,
    );
    set(toPanelState(clamped));
  },

  setSelectedProfileId: (id) => {
    const profile = get().profiles.find((p) => p.id === id);
    if (!profile) return;

    set({
      selectedProfileId: id,
      temperature: profile.temperature,
      topP: profile.topP,
      maxTokens: profile.maxTokens,
      thinkingEnabled: profile.thinkingEnabled,
      thinkingEffort: profile.thinkingEffort,
    });
  },

  setPromptTemplate: (promptTemplate) => set({ promptTemplate }),

  saveCurrentPromptAsDefault: () => {
    const { activeFieldId, selectedProfileId, promptTemplate, fieldConfigs } = get();
    if (!activeFieldId) return;

    const newConfig: FieldPromptConfig = {
      fieldId: activeFieldId,
      agentProfileId: selectedProfileId,
      promptTemplate,
    };

    const nextConfigs = {
      ...fieldConfigs,
      [activeFieldId]: newConfig,
    };

    set({ fieldConfigs: nextConfigs });
    const softwareDataPath = getActiveSoftwareDataPath();
    if (softwareDataPath) {
      void saveFieldPromptConfigs(fieldPromptConfigRepository, softwareDataPath, nextConfigs);
    }
  },

  setTemperature: (temperature) => {
    set({ temperature: clampTemperature(temperature) });
    scheduleProfileParamsSave();
  },
  setTopP: (topP) => {
    set({ topP: clampTopP(topP) });
    scheduleProfileParamsSave();
  },
  setMaxTokens: (maxTokens) => {
    set({ maxTokens: clampMaxTokens(maxTokens) });
    scheduleProfileParamsSave();
  },
  setThinkingEnabled: (thinkingEnabled) => {
    set({ thinkingEnabled });
    scheduleProfileParamsSave();
  },
  setThinkingEffort: (thinkingEffort) => {
    set({ thinkingEffort });
    scheduleProfileParamsSave();
  },

  resetSelectedProfileParams: () => {
    const builtin = getBuiltInAgentProfile(get().selectedProfileId);
    if (!builtin) return;

    set({
      temperature: builtin.temperature,
      topP: builtin.topP,
      maxTokens: builtin.maxTokens,
      thinkingEnabled: builtin.thinkingEnabled,
      thinkingEffort: builtin.thinkingEffort,
    });

    if (profileParamsSaveTimer) clearTimeout(profileParamsSaveTimer);
    void persistSelectedProfileParams(get()).then((profiles) => set({ profiles }));
  },

  abortStream: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ abortController: null, streaming: false });
  },

  clearSessionMessages: () => {
    get().abortStream();
    set({ messages: [], streamingContent: "", generationStatus: "idle", error: null });
  },

  startSession: async (llmSettings) => {
    if (get().streaming) return;

    const { activeFieldId, promptTemplate, selectedProfileId, profiles } = get();
    if (!activeFieldId) return;

    try {
      validateLlmSettings(llmSettings);
    } catch (error) {
      set({ error: llmErrorMessage(error) });
      return;
    }

    const resolver = (fId: string) => useAiFieldRegistryStore.getState().getFieldValue(fId);
    const selfValue = useAiFieldRegistryStore.getState().getFieldValue(activeFieldId);
    const finalPrompt = renderPromptTemplate(promptTemplate, selfValue, resolver);

    const profile = profiles.find((p) => p.id === selectedProfileId);
    const systemPrompt = profile?.systemPrompt || "你是一个得力的创作助手。";

    const systemMessage = createChatMessage("system", systemPrompt);
    const userMessage = createChatMessage("user", finalPrompt);
    const assistantMessage = createChatMessage("assistant", "");

    const history = [systemMessage, userMessage];

    set({
      messages: [userMessage, assistantMessage],
      activeTab: "chat",
    });

    await runAssistantStream(history, assistantMessage.id, llmSettings);
  },

  sendFollowUp: async (content, llmSettings) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (get().streaming) return;

    const { activeFieldId, selectedProfileId, profiles, messages } = get();
    if (!activeFieldId) return;

    try {
      validateLlmSettings(llmSettings);
    } catch (error) {
      set({ error: llmErrorMessage(error) });
      return;
    }

    const profile = profiles.find((p) => p.id === selectedProfileId);
    const systemPrompt = profile?.systemPrompt || "你是一个得力的创作助手。";

    const userMessage = createChatMessage("user", trimmed);
    const assistantMessage = createChatMessage("assistant", "");

    const systemMessage = createChatMessage("system", systemPrompt);
    const apiHistory = [systemMessage, ...messages, userMessage];

    set({
      messages: [...messages, userMessage, assistantMessage],
    });

    await runAssistantStream(apiHistory, assistantMessage.id, llmSettings);
  },

  regenerate: async (llmSettings) => {
    const { messages } = get();
    let lastAssistantId: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        lastAssistantId = messages[i].id;
        break;
      }
    }
    if (!lastAssistantId) return;
    await get().regenerateFrom(lastAssistantId, llmSettings);
  },

  regenerateFrom: async (messageId, llmSettings) => {
    if (get().streaming) return;

    const { activeFieldId, selectedProfileId, profiles, messages } = get();
    if (!activeFieldId) return;

    const targetIdx = messages.findIndex((msg) => msg.id === messageId);
    if (targetIdx === -1) return;

    const target = messages[targetIdx];
    if (target.role === "system") return;

    try {
      validateLlmSettings(llmSettings);
    } catch (error) {
      set({ error: llmErrorMessage(error) });
      return;
    }

    const profile = profiles.find((p) => p.id === selectedProfileId);
    const systemPrompt = profile?.systemPrompt || "你是一个得力的创作助手。";
    const systemMessage = createChatMessage("system", systemPrompt);

    let priorMessages: ChatMessage[];
    let assistantId: string;
    let nextMessages: ChatMessage[];

    if (target.role === "assistant") {
      priorMessages = messages.slice(0, targetIdx).filter((msg) => msg.role !== "system");
      const resetAssistant = { ...target, content: "" };
      nextMessages = [...messages.slice(0, targetIdx), resetAssistant];
      assistantId = target.id;
    } else {
      priorMessages = messages.slice(0, targetIdx + 1).filter((msg) => msg.role !== "system");
      const assistantMessage = createChatMessage("assistant", "");
      nextMessages = [...messages.slice(0, targetIdx + 1), assistantMessage];
      assistantId = assistantMessage.id;
    }

    const apiHistory = [systemMessage, ...priorMessages];
    set({ messages: nextMessages });

    await runAssistantStream(apiHistory, assistantId, llmSettings);
  },

  editMessage: (messageId, content) => {
    if (get().streaming) return;
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content } : msg,
      ),
    }));
  },

  applyToField: (mode, customText) => {
    const { activeFieldId, messages, streamingContent } = get();
    if (!activeFieldId) return;

    let textToApply = "";
    if (customText !== undefined) {
      textToApply = customText;
    } else {
      const lastAssistantMsg = [...messages].reverse().find((m) => msgIsAssistant(m));
      textToApply = lastAssistantMsg ? lastAssistantMsg.content : streamingContent;
    }

    if (!textToApply) return;

    const registry = useAiFieldRegistryStore.getState();
    if (mode === "replace") {
      registry.setFieldValue(activeFieldId, textToApply);
    } else if (mode === "append") {
      const currentVal = registry.getFieldValue(activeFieldId);
      const separator = currentVal ? "\n\n" : "";
      registry.setFieldValue(activeFieldId, currentVal + separator + textToApply);
    }

    get().closeSession();
  },
  };
});
