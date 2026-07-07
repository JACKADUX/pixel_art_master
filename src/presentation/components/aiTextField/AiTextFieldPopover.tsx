import { useEffect, useRef, useState, type CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useAiTextFieldSessionStore,
  type AiTextFieldTab,
  type AiGenerationStatus,
} from "../../stores/aiTextFieldSessionStore";
import { useAiFieldRegistryStore } from "../../stores/aiFieldRegistryStore";
import { useAppStore } from "../../stores/appStore";
import { resolveActiveLlmSettings } from "@/domain/llm/LlmSettings";
import { providerRequiresApiKey } from "@/domain/llm/LlmProvider";
import {
  areAgentProfileParamsEqual,
  formatAgentProfileParamsSummary,
  getBuiltInAgentProfile,
} from "@/domain/aiTextField/AgentProfile";
import { PortalSelect } from "./PortalSelect";

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const CHAT_SCROLL_NEAR_BOTTOM_THRESHOLD = 48;

const RESIZE_HANDLES: Array<{ dir: ResizeDirection; className: string; cursor: string }> = [
  { dir: "n", className: "left-2 right-2 top-0 h-2", cursor: "ns-resize" },
  { dir: "s", className: "bottom-0 left-2 right-2 h-2", cursor: "ns-resize" },
  { dir: "e", className: "right-0 top-2 bottom-2 w-2", cursor: "ew-resize" },
  { dir: "w", className: "left-0 top-2 bottom-2 w-2", cursor: "ew-resize" },
  { dir: "ne", className: "right-0 top-0 h-3 w-3", cursor: "nesw-resize" },
  { dir: "nw", className: "left-0 top-0 h-3 w-3", cursor: "nwse-resize" },
  { dir: "se", className: "right-0 bottom-0 h-3 w-3", cursor: "nwse-resize" },
  { dir: "sw", className: "left-0 bottom-0 h-3 w-3", cursor: "nesw-resize" },
];

function AiSparkleIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813ZM18.281 9.281 17.5 13l-.781-3.719L13 8.5l3.719-.781L17.5 4l.781 3.719L22 8.5l-3.719.781Z"
      />
    </svg>
  );
}

const GENERATION_STATUS_LABEL: Record<AiGenerationStatus, string> = {
  idle: "",
  waiting: "正在连接模型，等待响应…",
  streaming: "正在生成…",
  empty: "未生成任何内容",
  aborted: "已停止生成",
  error: "生成失败",
};

function GenerationStatusIndicator({ status }: { status: AiGenerationStatus }) {
  const label = GENERATION_STATUS_LABEL[status] || "处理中…";
  const isBusy = status === "waiting" || status === "streaming";
  const isProblem = status === "empty" || status === "error";

  return (
    <span
      className={`flex items-center gap-1.5 text-[11px] ${
        isProblem ? "text-amber-400" : "text-zinc-400"
      }`}
    >
      {isBusy ? (
        <span className="flex gap-0.5">
          <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-current" />
        </span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-3.5 w-3.5 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m0 3.75h.008v.008H12V16.5Zm9-4.5a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      )}
      {label}
    </span>
  );
}

export function AiTextFieldPopover() {
  const isOpen = useAiTextFieldSessionStore((s) => s.isOpen);
  const activeFieldId = useAiTextFieldSessionStore((s) => s.activeFieldId);
  const activeFieldLabel = useAiTextFieldSessionStore((s) => s.activeFieldLabel);
  const activeTab = useAiTextFieldSessionStore((s) => s.activeTab);
  const panelX = useAiTextFieldSessionStore((s) => s.panelX);
  const panelY = useAiTextFieldSessionStore((s) => s.panelY);
  const panelWidth = useAiTextFieldSessionStore((s) => s.panelWidth);
  const panelHeight = useAiTextFieldSessionStore((s) => s.panelHeight);
  const closeSession = useAiTextFieldSessionStore((s) => s.closeSession);
  const setActiveTab = useAiTextFieldSessionStore((s) => s.setActiveTab);
  const setPanelGeometry = useAiTextFieldSessionStore((s) => s.setPanelGeometry);

  const profiles = useAiTextFieldSessionStore((s) => s.profiles);
  const selectedProfileId = useAiTextFieldSessionStore((s) => s.selectedProfileId);
  const promptTemplate = useAiTextFieldSessionStore((s) => s.promptTemplate);
  const setSelectedProfileId = useAiTextFieldSessionStore((s) => s.setSelectedProfileId);
  const setPromptTemplate = useAiTextFieldSessionStore((s) => s.setPromptTemplate);
  const saveCurrentPromptAsDefault = useAiTextFieldSessionStore((s) => s.saveCurrentPromptAsDefault);

  const temperature = useAiTextFieldSessionStore((s) => s.temperature);
  const topP = useAiTextFieldSessionStore((s) => s.topP);
  const maxTokens = useAiTextFieldSessionStore((s) => s.maxTokens);
  const thinkingEnabled = useAiTextFieldSessionStore((s) => s.thinkingEnabled);
  const thinkingEffort = useAiTextFieldSessionStore((s) => s.thinkingEffort);
  const setTemperature = useAiTextFieldSessionStore((s) => s.setTemperature);
  const setTopP = useAiTextFieldSessionStore((s) => s.setTopP);
  const setMaxTokens = useAiTextFieldSessionStore((s) => s.setMaxTokens);
  const setThinkingEnabled = useAiTextFieldSessionStore((s) => s.setThinkingEnabled);
  const setThinkingEffort = useAiTextFieldSessionStore((s) => s.setThinkingEffort);
  const resetSelectedProfileParams = useAiTextFieldSessionStore((s) => s.resetSelectedProfileParams);

  const messages = useAiTextFieldSessionStore((s) => s.messages);
  const streaming = useAiTextFieldSessionStore((s) => s.streaming);
  const streamingContent = useAiTextFieldSessionStore((s) => s.streamingContent);
  const generationStatus = useAiTextFieldSessionStore((s) => s.generationStatus);
  const error = useAiTextFieldSessionStore((s) => s.error);
  const startSession = useAiTextFieldSessionStore((s) => s.startSession);
  const sendFollowUp = useAiTextFieldSessionStore((s) => s.sendFollowUp);
  const regenerateFrom = useAiTextFieldSessionStore((s) => s.regenerateFrom);
  const editMessage = useAiTextFieldSessionStore((s) => s.editMessage);
  const abortStream = useAiTextFieldSessionStore((s) => s.abortStream);
  const applyToField = useAiTextFieldSessionStore((s) => s.applyToField);

  const listFields = useAiFieldRegistryStore((s) => s.listFields);

  const llmSettingsStore = useAppStore((s) => s.llmSettingsStore);
  const llmSettings = resolveActiveLlmSettings(llmSettingsStore);
  const openSettingsModal = useAppStore((s) => s.openSettingsModal);

  const [showParams, setShowParams] = useState(false);
  const [followUpInput, setFollowUpInput] = useState("");
  const [editingText, setEditingText] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");

  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });
  const resizeStartRef = useRef<{
    dir: ResizeDirection;
    x: number;
    y: number;
    panelX: number;
    panelY: number;
    panelWidth: number;
    panelHeight: number;
  } | null>(null);

  const updateNearBottom = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distance <= CHAT_SCROLL_NEAR_BOTTOM_THRESHOLD;
  };

  const scrollChatToBottom = (force = false) => {
    const el = chatScrollRef.current;
    if (!el) return;
    if (!force && !isNearBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
    isNearBottomRef.current = true;
  };

  useEffect(() => {
    if (activeTab !== "chat") return;
    scrollChatToBottom();
  }, [messages, streamingContent, streaming, activeTab, activeFieldId]);

  useEffect(() => {
    if (activeTab === "chat") {
      isNearBottomRef.current = true;
      scrollChatToBottom(true);
    }
  }, [activeFieldId, activeTab]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPanelGeometry(
          dragStartRef.current.panelX + dx,
          dragStartRef.current.panelY + dy,
        );
        return;
      }

      if (resizeStartRef.current) {
        const start = resizeStartRef.current;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;

        let nextX = start.panelX;
        let nextY = start.panelY;
        let nextWidth = start.panelWidth;
        let nextHeight = start.panelHeight;

        if (start.dir.includes("e")) nextWidth = start.panelWidth + dx;
        if (start.dir.includes("w")) {
          nextWidth = start.panelWidth - dx;
          nextX = start.panelX + dx;
        }
        if (start.dir.includes("s")) nextHeight = start.panelHeight + dy;
        if (start.dir.includes("n")) {
          nextHeight = start.panelHeight - dy;
          nextY = start.panelY + dy;
        }

        setPanelGeometry(nextX, nextY, nextWidth, nextHeight);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      resizeStartRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setPanelGeometry]);

  if (!isOpen || !activeFieldId) return null;

  const needsApiKey = providerRequiresApiKey(llmSettings.provider);
  const configReady =
    llmSettings.model.trim() !== "" &&
    llmSettings.baseUrl.trim() !== "" &&
    (!needsApiKey || llmSettings.apiKey.trim() !== "");

  const panelStyle: CSSProperties = {
    position: "fixed",
    left: panelX,
    top: panelY,
    width: panelWidth,
    height: panelHeight,
    zIndex: 250,
  };

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panelX,
      panelY,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "move";
  };

  const handleResizeMouseDown = (dir: ResizeDirection, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current = {
      dir,
      x: e.clientX,
      y: e.clientY,
      panelX,
      panelY,
      panelWidth,
      panelHeight,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = RESIZE_HANDLES.find((h) => h.dir === dir)?.cursor ?? "default";
  };

  const handleInsertField = (fieldId: string) => {
    const textarea = templateTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = promptTemplate;
    const insertText = `{{field:${fieldId}}}`;
    const nextText = text.substring(0, start) + insertText + text.substring(end);

    setPromptTemplate(nextText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 0);
  };

  const handleStart = () => {
    if (!configReady) {
      openSettingsModal();
      return;
    }
    isNearBottomRef.current = true;
    void startSession(llmSettings);
  };

  const handleSendFollowUp = () => {
    const text = followUpInput.trim();
    if (!text || streaming) return;
    setFollowUpInput("");
    isNearBottomRef.current = true;
    void sendFollowUp(text, llmSettings);
  };

  const handleApply = (mode: "replace" | "append", content: string) => {
    applyToField(mode, content);
  };

  const handleRegenerateFrom = (messageId: string) => {
    if (streaming) return;
    if (!configReady) {
      openSettingsModal();
      return;
    }
    isNearBottomRef.current = true;
    void regenerateFrom(messageId, llmSettings);
  };

  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setMessageDraft(content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setMessageDraft("");
  };

  const handleSaveEdit = () => {
    if (editingMessageId === null) return;
    editMessage(editingMessageId, messageDraft);
    setEditingMessageId(null);
    setMessageDraft("");
  };

  const handleSaveEditAndRegenerate = () => {
    if (editingMessageId === null) return;
    const targetId = editingMessageId;
    editMessage(targetId, messageDraft);
    setEditingMessageId(null);
    setMessageDraft("");
    if (!configReady) {
      openSettingsModal();
      return;
    }
    isNearBottomRef.current = true;
    void regenerateFrom(targetId, llmSettings);
  };

  const handleSaveEditAndApply = (mode: "replace" | "append") => {
    if (editingText !== null) {
      applyToField(mode, editingText);
      setEditingText(null);
    }
  };

  const tabButtonClass = (tab: AiTextFieldTab) =>
    `rounded px-2.5 py-1 text-[10px] font-medium transition ${
      activeTab === tab
        ? "bg-blue-600 text-white"
        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
    }`;

  const builtInDefault = getBuiltInAgentProfile(selectedProfileId);
  const currentParams = {
    temperature,
    topP,
    maxTokens,
    thinkingEnabled,
    thinkingEffort,
  };
  const paramsModified =
    builtInDefault !== undefined &&
    !areAgentProfileParamsEqual(currentParams, builtInDefault);
  const paramsSummary = formatAgentProfileParamsSummary(currentParams);

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

  return (
    <div
      style={panelStyle}
      className="flex flex-col rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl"
    >
      <header
        className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-3 py-2.5"
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex min-w-0 items-center gap-2 pr-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-600/20 text-blue-400">
            <AiSparkleIcon />
          </span>
          <h2 className="truncate text-xs font-semibold text-zinc-200">
            AI 辅助写作：<span className="text-blue-400">{activeFieldLabel}</span>
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("config")}
            onMouseDown={(e) => e.stopPropagation()}
            className={tabButtonClass("config")}
          >
            Agent 配置
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            onMouseDown={(e) => e.stopPropagation()}
            className={tabButtonClass("chat")}
          >
            对话
          </button>
          <button
            type="button"
            onClick={closeSession}
            onMouseDown={(e) => e.stopPropagation()}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        {activeTab === "config" ? (
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <div className="flex min-h-0 flex-1 flex-col space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                <div className="relative z-10 flex shrink-0 items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-medium text-zinc-400">选择 Agent 档案</label>
                  <PortalSelect
                    value={selectedProfileId}
                    options={profiles.map((profile) => ({
                      value: profile.id,
                      label: profile.name,
                    }))}
                    onChange={setSelectedProfileId}
                    className="h-7 min-w-[8rem]"
                    zIndex={270}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!showParams && (
                    <span className="max-w-[14rem] truncate text-[10px] text-zinc-500" title={paramsSummary}>
                      {paramsSummary}
                    </span>
                  )}
                  {paramsModified && (
                    <button
                      type="button"
                      onClick={resetSelectedProfileParams}
                      className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 transition hover:border-zinc-600 hover:text-amber-400"
                    >
                      重置
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowParams(!showParams)}
                    className="text-[10px] text-zinc-400 transition hover:text-blue-400"
                  >
                    {showParams ? "隐藏参数 ▴" : "微调参数 ▾"}
                  </button>
                </div>
              </div>

              {showParams && (
                <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-2 border-t border-zinc-800 pt-2 text-[10px] text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span>温度 (Temp): {temperature}</span>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="h-1 w-24 accent-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>核采样 (Top P): {topP}</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={topP}
                      onChange={(e) => setTopP(parseFloat(e.target.value))}
                      className="h-1 w-24 accent-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>最大 Token: {maxTokens}</span>
                    <input
                      type="number"
                      min="256"
                      max="8192"
                      step="128"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 2048)}
                      className="w-20 rounded border border-zinc-700 bg-zinc-800 px-1 text-center text-[10px]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      开启思考:
                      <input
                        type="checkbox"
                        checked={thinkingEnabled}
                        onChange={(e) => setThinkingEnabled(e.target.checked)}
                        className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                      />
                    </span>
                    {thinkingEnabled && (
                      <select
                        value={thinkingEffort}
                        onChange={(e) =>
                          setThinkingEffort(e.target.value as "low" | "medium" | "high")
                        }
                        className="h-5 rounded border border-zinc-700 bg-zinc-800 px-1 text-[9px]"
                      >
                        <option value="low">低</option>
                        <option value="medium">中</option>
                        <option value="high">高</option>
                      </select>
                    )}
                  </div>
                </div>
              )}

              <div className="flex min-h-0 flex-1 flex-col space-y-1.5 border-t border-zinc-800 pt-2.5">
                <div className="flex shrink-0 items-center justify-between">
                  <label className="text-[11px] font-medium text-zinc-400">预设 Prompt 模板</label>
                  <div className="flex items-center gap-2">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleInsertField(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="h-6 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-[10px] text-zinc-300 outline-none focus:border-blue-500"
                    >
                      <option value="" disabled>
                        + 引用其他字段
                      </option>
                      {listFields()
                        .filter((f) => f.fieldId !== activeFieldId)
                        .map((f) => (
                          <option key={f.fieldId} value={f.fieldId}>
                            {f.label}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={saveCurrentPromptAsDefault}
                      title="保存当前模板和 Agent 设为该字段的默认配置"
                      className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 transition hover:bg-zinc-700"
                    >
                      设为默认
                    </button>
                  </div>
                </div>
                <textarea
                  ref={templateTextareaRef}
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  placeholder="输入 Prompt 模板，使用 {{self}} 引用当前文本，使用 {{field:ID}} 引用其他字段..."
                  className="min-h-0 flex-1 resize-none rounded border border-zinc-700 bg-zinc-800 p-2 text-[11px] leading-relaxed text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 shrink-0">
              <button
                type="button"
                onClick={handleStart}
                disabled={streaming}
                className="flex w-full items-center justify-center gap-1.5 rounded bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                <AiSparkleIcon className="h-4 w-4" />
                开始生成文本
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              ref={chatScrollRef}
              onScroll={updateNearBottom}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
            >
              {messages.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
                  <p className="mb-3 text-xs text-zinc-500">
                    {configReady
                      ? "在 Agent 配置中设置 Prompt，或点击下方按钮开始生成"
                      : "请先在设置中配置 AI 提供商和 API Key"}
                  </p>
                  {!configReady && (
                    <button
                      type="button"
                      onClick={openSettingsModal}
                      className="rounded bg-amber-600 px-3 py-1.5 text-xs text-white transition hover:bg-amber-500"
                    >
                      前往配置 AI
                    </button>
                  )}
                </div>
              )}

              {messages.map((msg) => {
                if (msg.role === "system") return null;
                const isUser = msg.role === "user";
                const isLast = msg.id === lastMessage?.id;
                const isStreamingTarget = streaming && isLast && !isUser;
                const displayContent = isStreamingTarget ? streamingContent : msg.content;
                const isEditing = editingMessageId === msg.id;
                const showStatus = !isUser && isLast && !displayContent;
                const showActions = !isUser && !!displayContent && !isStreamingTarget && !isEditing;
                const showRegenerate = !isUser && !isStreamingTarget && !isEditing && !streaming;
                const showEdit = !!displayContent && !isStreamingTarget && !isEditing && !streaming;
                const regenerateLabel = isLast ? "重新生成" : "重新向下生成";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[9px] text-zinc-500">
                      {isUser ? "你 (Prompt)" : isStreamingTarget ? "AI (正在输入...)" : "AI"}
                    </span>

                    {isEditing ? (
                      <div className="w-full space-y-2 rounded-lg border border-blue-500/40 bg-blue-950/10 p-2">
                        <textarea
                          value={messageDraft}
                          onChange={(e) => setMessageDraft(e.target.value)}
                          rows={Math.min(10, Math.max(2, messageDraft.split("\n").length))}
                          autoFocus
                          className="w-full resize-none rounded border border-zinc-700 bg-zinc-800 p-2 text-xs leading-relaxed text-zinc-100 outline-none focus:border-blue-500"
                        />
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200 transition hover:bg-zinc-700"
                          >
                            仅保存
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEditAndRegenerate}
                            disabled={!messageDraft.trim()}
                            className="rounded bg-blue-600 px-2 py-0.5 text-[10px] text-white transition hover:bg-blue-500 disabled:opacity-50"
                          >
                            保存并向下生成
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                          isUser
                            ? "border border-blue-500/30 bg-blue-600/20 text-blue-100"
                            : "border border-zinc-700 bg-zinc-800 text-zinc-100"
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : displayContent ? (
                          <div className="prose prose-invert prose-xs max-w-none prose-p:my-0.5 prose-pre:my-1 prose-pre:bg-zinc-950">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
                          </div>
                        ) : showStatus ? (
                          <GenerationStatusIndicator status={generationStatus} />
                        ) : (
                          <GenerationStatusIndicator status="empty" />
                        )}
                      </div>
                    )}

                    {!isEditing && (showActions || showRegenerate || showEdit) && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {showActions && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApply("replace", displayContent)}
                              className="rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-400 transition hover:bg-zinc-800 hover:text-blue-400"
                            >
                              填入
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApply("append", displayContent)}
                              className="rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-400 transition hover:bg-zinc-800 hover:text-blue-400"
                            >
                              追加
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingText(displayContent)}
                              className="rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-400 transition hover:bg-zinc-800 hover:text-blue-400"
                            >
                              编辑后追加
                            </button>
                          </>
                        )}
                        {showEdit && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(msg.id, displayContent)}
                            className="flex items-center gap-1 rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-400 transition hover:bg-zinc-800 hover:text-blue-400"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              strokeWidth={1.8}
                              stroke="currentColor"
                              className="h-3 w-3"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                              />
                            </svg>
                            编辑
                          </button>
                        )}
                        {showRegenerate && (
                          <button
                            type="button"
                            onClick={() => handleRegenerateFrom(msg.id)}
                            className="flex items-center gap-1 rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-400 transition hover:bg-zinc-800 hover:text-blue-400"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              strokeWidth={1.8}
                              stroke="currentColor"
                              className="h-3 w-3"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                              />
                            </svg>
                            {regenerateLabel}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {error && (
                <div
                  className={`rounded border px-2.5 py-1.5 text-[10px] ${
                    generationStatus === "empty"
                      ? "border-amber-900/60 bg-amber-950/30 text-amber-300"
                      : "border-red-900/60 bg-red-950/40 text-red-300"
                  }`}
                >
                  {error}
                </div>
              )}

              {editingText !== null && (
                <div className="space-y-2 rounded-lg border border-blue-500/30 bg-blue-950/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-blue-400">编辑 AI 回答：</span>
                    <button
                      type="button"
                      onClick={() => setEditingText(null)}
                      className="text-[9px] text-zinc-400 hover:text-red-400"
                    >
                      取消
                    </button>
                  </div>
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={4}
                    className="w-full rounded border border-zinc-700 bg-zinc-800 p-2 text-xs leading-relaxed text-zinc-100 outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEditAndApply("replace")}
                      className="rounded bg-zinc-800 px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700"
                    >
                      保存并填入
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEditAndApply("append")}
                      className="rounded bg-blue-600 px-2.5 py-1 text-[10px] text-white hover:bg-blue-500"
                    >
                      保存并追加
                    </button>
                  </div>
                </div>
              )}

            </div>

            <footer className="shrink-0 border-t border-zinc-800 p-3">
              {messages.length === 0 ? (
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={streaming}
                  className="flex w-full items-center justify-center gap-1.5 rounded bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  <AiSparkleIcon className="h-4 w-4" />
                  开始生成文本
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendFollowUp();
                      }
                    }}
                    placeholder={
                      streaming ? "正在生成中..." : "输入追问或微调指令（如：字数缩短一半）..."
                    }
                    disabled={streaming}
                    className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                  {streaming ? (
                    <button
                      type="button"
                      onClick={abortStream}
                      className="rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
                    >
                      停止
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendFollowUp}
                      disabled={!followUpInput.trim()}
                      className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
                    >
                      发送
                    </button>
                  )}
                </div>
              )}
            </footer>
          </>
        )}
      </div>

      {RESIZE_HANDLES.map((handle) => (
        <div
          key={handle.dir}
          className={`absolute z-10 ${handle.className}`}
          style={{ cursor: handle.cursor }}
          onMouseDown={(e) => handleResizeMouseDown(handle.dir, e)}
        />
      ))}
    </div>
  );
}
