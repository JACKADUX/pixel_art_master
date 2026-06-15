import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { providerRequiresApiKey } from "@/domain/llm/LlmProvider";
import { resolveActiveLlmSettings } from "@/domain/llm/LlmSettings";
import { useAppStore } from "../../stores/appStore";
import { useAiChatStore } from "../../stores/aiChatStore";

function MessageBubble({
  role,
  content,
  streaming,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : "border border-zinc-700 bg-zinc-900 text-zinc-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-zinc-950 prose-pre:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : streaming ? (
          <span className="text-zinc-500">正在输入…</span>
        ) : null}
      </div>
    </div>
  );
}

export function AiChatTestPage() {
  const openPage = useAiChatStore((s) => s.open);
  const messages = useAiChatStore((s) => s.messages);
  const streaming = useAiChatStore((s) => s.streaming);
  const streamingContent = useAiChatStore((s) => s.streamingContent);
  const error = useAiChatStore((s) => s.error);
  const closePage = useAiChatStore((s) => s.closePage);
  const sendMessage = useAiChatStore((s) => s.sendMessage);
  const abortStream = useAiChatStore((s) => s.abortStream);
  const clearMessages = useAiChatStore((s) => s.clearMessages);

  const llmSettingsStore = useAppStore((s) => s.llmSettingsStore);
  const llmSettings = resolveActiveLlmSettings(llmSettingsStore);
  const openSettingsModal = useAppStore((s) => s.openSettingsModal);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const needsApiKey = providerRequiresApiKey(llmSettings.provider);
  const configReady =
    llmSettings.model.trim() !== "" &&
    llmSettings.baseUrl.trim() !== "" &&
    (!needsApiKey || llmSettings.apiKey.trim() !== "");

  useEffect(() => {
    if (!openPage) return;
    textareaRef.current?.focus();
  }, [openPage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, streaming]);

  if (!openPage) return null;

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    void sendMessage(text, llmSettings);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const lastMessage = messages[messages.length - 1];
  const showStreamingBubble =
    streaming && lastMessage?.role === "assistant" && lastMessage.content === "";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={closePage}
            className="rounded px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            ← 返回编辑器
          </button>
          <h1 className="text-sm font-medium">AI 对话测试</h1>
          <span
            className={`rounded px-2 py-0.5 text-[10px] ${
              configReady
                ? "bg-emerald-900/50 text-emerald-300"
                : "bg-amber-900/50 text-amber-300"
            }`}
          >
            {configReady ? "已配置" : "未配置"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearMessages}
            disabled={streaming || messages.length === 0}
            className="rounded px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            清空对话
          </button>
          <button
            type="button"
            onClick={openSettingsModal}
            className="rounded bg-zinc-800 px-3 py-1.5 text-xs transition hover:bg-zinc-700"
          >
            打开设置
          </button>
        </div>
      </header>

      {!configReady && (
        <div className="border-b border-amber-900/50 bg-amber-950/30 px-4 py-2 text-xs text-amber-200">
          请先在设置 → AI 中配置提供商、模型
          {needsApiKey ? " 与 API Key" : ""}，再进行对话测试。
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              发送消息以测试 LLM 流式对话（{llmSettings.provider} / {llmSettings.model || "未设置模型"}）
            </p>
          )}

          {messages.map((message) => {
            if (message.role === "system") return null;
            const isStreamingAssistant =
              streaming &&
              message.id === lastMessage?.id &&
              message.role === "assistant" &&
              message.content === "";
            const displayContent = isStreamingAssistant
              ? streamingContent
              : message.content;

            return (
              <MessageBubble
                key={message.id}
                role={message.role as "user" | "assistant"}
                content={displayContent}
                streaming={isStreamingAssistant}
              />
            );
          })}

          {showStreamingBubble && !streamingContent && (
            <MessageBubble role="assistant" content="" streaming />
          )}

          {error && (
            <div className="rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="shrink-0 border-t border-zinc-800 px-4 py-3">
        <div className="mx-auto flex max-w-3xl gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={configReady ? "输入消息，Enter 发送，Shift+Enter 换行…" : "请先完成 AI 设置…"}
            disabled={!configReady || streaming}
            rows={3}
            className="min-h-[4.5rem] flex-1 resize-none rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex flex-col gap-2">
            {streaming ? (
              <button
                type="button"
                onClick={abortStream}
                className="rounded bg-red-700 px-4 py-2 text-xs font-medium transition hover:bg-red-600"
              >
                停止
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!configReady || !input.trim()}
                className="rounded bg-blue-600 px-4 py-2 text-xs font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                发送
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
