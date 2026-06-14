import { create } from "zustand";
import { streamChatCompletion } from "@/application/use-cases/StreamChatCompletion";
import { createChatMessage, type ChatMessage } from "@/domain/llm/ChatMessage";
import { isLlmError, llmErrorMessage } from "@/domain/llm/LlmError";
import { validateLlmSettings } from "@/domain/llm/LlmSettings";
import { llmClient } from "@/infrastructure/llm/createLlmClient";
import { useAppStore } from "./appStore";

interface AiChatStore {
  open: boolean;
  messages: ChatMessage[];
  streaming: boolean;
  streamingContent: string;
  error: string | null;
  abortController: AbortController | null;

  openPage: () => void;
  closePage: () => void;
  reset: () => void;
  abortStream: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const initialState = {
  open: false,
  messages: [] as ChatMessage[],
  streaming: false,
  streamingContent: "",
  error: null as string | null,
  abortController: null as AbortController | null,
};

export const useAiChatStore = create<AiChatStore>((set, get) => ({
  ...initialState,

  openPage: () => set({ open: true }),

  closePage: () => {
    get().abortStream();
    set({ open: false });
  },

  reset: () => {
    get().abortStream();
    set({ ...initialState });
  },

  abortStream: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ abortController: null, streaming: false });
  },

  clearMessages: () => {
    get().abortStream();
    set({ messages: [], streamingContent: "", error: null });
  },

  sendMessage: async (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (get().streaming) return;

    const llmSettings = useAppStore.getState().llmSettings;
    try {
      validateLlmSettings(llmSettings);
    } catch (error) {
      set({ error: llmErrorMessage(error) });
      return;
    }

    const userMessage = createChatMessage("user", trimmed);
    const assistantMessage = createChatMessage("assistant", "");
    const history = [...get().messages, userMessage];

    const abortController = new AbortController();
    set({
      messages: [...history, assistantMessage],
      streaming: true,
      streamingContent: "",
      error: null,
      abortController,
    });

    let accumulated = "";

    try {
      for await (const chunk of streamChatCompletion(
        llmClient,
        llmSettings,
        history,
        abortController.signal,
      )) {
        accumulated += chunk;
        set({ streamingContent: accumulated });
      }

      set((state) => ({
        messages: state.messages.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, content: accumulated }
            : message,
        ),
        streaming: false,
        streamingContent: "",
        abortController: null,
      }));
    } catch (error) {
      const message = llmErrorMessage(error);
      const isAborted = isLlmError(error) && error.code === "aborted";

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: accumulated || (isAborted ? "（已停止）" : "") }
            : msg,
        ),
        streaming: false,
        streamingContent: "",
        abortController: null,
        error: isAborted ? null : message,
      }));
    }
  },
}));
