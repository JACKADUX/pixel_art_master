import { create } from "zustand";
import { streamImageRecognition } from "@/application/use-cases/StreamImageRecognition";
import { createChatMessage, type ChatMessage } from "@/domain/llm/ChatMessage";
import { isLlmError, llmErrorMessage } from "@/domain/llm/LlmError";
import { validateLlmSettings, type LlmSettings } from "@/domain/llm/LlmSettings";
import type { EncodedImage } from "@/infrastructure/image/encodeImageToDataUrl";
import { llmClient } from "@/infrastructure/llm/createLlmClient";

interface AiVisionStore {
  open: boolean;
  /** 待识别的图片，发送后清空 */
  image: EncodedImage | null;
  messages: ChatMessage[];
  streaming: boolean;
  streamingContent: string;
  error: string | null;
  abortController: AbortController | null;

  openPage: () => void;
  closePage: () => void;
  reset: () => void;
  setImage: (image: EncodedImage) => void;
  clearImage: () => void;
  setError: (message: string | null) => void;
  abortStream: () => void;
  recognize: (prompt: string, llmSettings: LlmSettings) => Promise<void>;
  clearMessages: () => void;
}

const initialState = {
  open: false,
  image: null as EncodedImage | null,
  messages: [] as ChatMessage[],
  streaming: false,
  streamingContent: "",
  error: null as string | null,
  abortController: null as AbortController | null,
};

export const useAiVisionStore = create<AiVisionStore>((set, get) => ({
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

  setImage: (image) => set({ image, error: null }),

  clearImage: () => set({ image: null }),

  setError: (message) => set({ error: message }),

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

  recognize: async (prompt, llmSettings) => {
    if (get().streaming) return;

    const image = get().image;
    if (!image) {
      set({ error: "请先上传图片" });
      return;
    }

    try {
      validateLlmSettings(llmSettings);
    } catch (error) {
      set({ error: llmErrorMessage(error) });
      return;
    }

    const trimmedPrompt = prompt.trim();
    const userMessage = createChatMessage("user", trimmedPrompt, {
      images: [image.dataUrl],
    });
    const assistantMessage = createChatMessage("assistant", "");
    const history = [...get().messages, userMessage];

    const abortController = new AbortController();
    set({
      messages: [...history, assistantMessage],
      image: null,
      streaming: true,
      streamingContent: "",
      error: null,
      abortController,
    });

    let accumulated = "";

    try {
      for await (const chunk of streamImageRecognition(
        llmClient,
        llmSettings,
        [image.dataUrl],
        trimmedPrompt,
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
