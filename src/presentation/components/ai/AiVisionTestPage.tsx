import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { providerRequiresApiKey } from "@/domain/llm/LlmProvider";
import { resolveActiveLlmSettings } from "@/domain/llm/LlmSettings";
import {
  encodeImageToDataUrl,
  ImageEncodeError,
} from "@/infrastructure/image/encodeImageToDataUrl";
import { useAppStore } from "../../stores/appStore";
import { useAiVisionStore } from "../../stores/aiVisionStore";

function VisionMessageBubble({
  role,
  content,
  images,
  streaming,
}: {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  streaming?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] space-y-2 rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : "border border-zinc-700 bg-zinc-900 text-zinc-100"
        }`}
      >
        {images && images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((url, index) => (
              <img
                key={index}
                src={url}
                alt="上传的图片"
                className="max-h-48 max-w-[12rem] rounded border border-black/20 object-contain"
              />
            ))}
          </div>
        )}
        {isUser ? (
          content ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : null
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-zinc-950 prose-pre:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : streaming ? (
          <span className="text-zinc-500">正在识别…</span>
        ) : null}
      </div>
    </div>
  );
}

export function AiVisionTestPage() {
  const openPage = useAiVisionStore((s) => s.open);
  const image = useAiVisionStore((s) => s.image);
  const messages = useAiVisionStore((s) => s.messages);
  const streaming = useAiVisionStore((s) => s.streaming);
  const streamingContent = useAiVisionStore((s) => s.streamingContent);
  const error = useAiVisionStore((s) => s.error);
  const closePage = useAiVisionStore((s) => s.closePage);
  const setImage = useAiVisionStore((s) => s.setImage);
  const clearImage = useAiVisionStore((s) => s.clearImage);
  const setError = useAiVisionStore((s) => s.setError);
  const recognize = useAiVisionStore((s) => s.recognize);
  const abortStream = useAiVisionStore((s) => s.abortStream);
  const clearMessages = useAiVisionStore((s) => s.clearMessages);

  const llmSettingsStore = useAppStore((s) => s.llmSettingsStore);
  const llmSettings = resolveActiveLlmSettings(llmSettingsStore);
  const openSettingsModal = useAppStore((s) => s.openSettingsModal);

  const [prompt, setPrompt] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsApiKey = providerRequiresApiKey(llmSettings.provider);
  const configReady =
    llmSettings.model.trim() !== "" &&
    llmSettings.baseUrl.trim() !== "" &&
    (!needsApiKey || llmSettings.apiKey.trim() !== "");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, streaming]);

  const acceptImage = async (source: File | Blob, fallbackName?: string) => {
    try {
      const encoded = await encodeImageToDataUrl(source, fallbackName);
      setImage(encoded);
    } catch (err) {
      if (err instanceof ImageEncodeError) {
        setError(err.message);
      } else {
        setError("图片处理失败");
      }
    }
  };

  if (!openPage) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void acceptImage(file);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void acceptImage(file);
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        if (blob) {
          event.preventDefault();
          void acceptImage(blob, `clipboard-${Date.now()}.png`);
          return;
        }
      }
    }
  };

  const handleSubmit = () => {
    if (!image || streaming || !configReady) return;
    const currentPrompt = prompt;
    setPrompt("");
    void recognize(currentPrompt, llmSettings);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100"
      onPaste={handlePaste}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={closePage}
            className="rounded px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            ← 返回编辑器
          </button>
          <h1 className="text-sm font-medium">AI 识图测试</h1>
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
            清空记录
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
          请先在设置 → AI 中配置提供商、支持视觉的模型
          {needsApiKey ? " 与 API Key" : ""}，再进行识图测试。
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              上传图片后点击「识别」，由 {llmSettings.provider} /{" "}
              {llmSettings.model || "未设置模型"} 进行识图反馈
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
              <VisionMessageBubble
                key={message.id}
                role={message.role as "user" | "assistant"}
                content={displayContent}
                images={message.images}
                streaming={isStreamingAssistant}
              />
            );
          })}

          {error && (
            <div className="rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="shrink-0 border-t border-zinc-800 px-4 py-3">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {image ? (
            <div className="flex items-center gap-3 rounded border border-zinc-700 bg-zinc-900 p-2">
              <img
                src={image.dataUrl}
                alt={image.name}
                className="h-16 w-16 rounded border border-zinc-700 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-zinc-300">{image.name}</p>
                <p className="text-[10px] text-zinc-500">
                  {(image.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={clearImage}
                disabled={streaming}
                className="rounded px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                移除
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              disabled={streaming}
              className={`flex h-20 flex-col items-center justify-center gap-1 rounded border border-dashed text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${
                dragActive
                  ? "border-blue-500 bg-blue-950/30 text-blue-300"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              <span>点击选择图片，或拖拽 / 粘贴图片到此处</span>
              <span className="text-[10px] text-zinc-600">
                支持 JPEG / PNG / WebP / GIF，最大 10MB
              </span>
            </button>
          )}

          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                configReady
                  ? "可选：输入识别要求（如“提取图中所有文字”），Enter 识别，Shift+Enter 换行…"
                  : "请先完成 AI 设置…"
              }
              disabled={!configReady || streaming}
              rows={2}
              className="min-h-[3rem] flex-1 resize-none rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                  disabled={!configReady || !image}
                  className="rounded bg-blue-600 px-4 py-2 text-xs font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  识别
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
