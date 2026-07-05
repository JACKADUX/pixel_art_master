import { useEffect, useMemo, useRef, useState } from "react";
import {
  collectWorldTags,
  dedupeTags,
  parseTags,
  type WorldEntity,
} from "@/domain/world/World";
import type { WorldSummary } from "@/domain/world/WorldSummary";
import { useWorldStore } from "../../stores/worldStore";
import { useWorldAgentSettingsStore } from "../../stores/worldAgentSettingsStore";
import { WorldAgentSettingsModal } from "./WorldAgentSettingsModal";
import { AiTextField } from "../aiTextField/AiTextField";

const inputClassName =
  "h-8 w-full rounded border border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-100 outline-none focus:border-blue-500";

export function WorldCreatorPage() {
  const open = useWorldStore((s) => s.open);
  const worlds = useWorldStore((s) => s.worlds);
  const activeWorld = useWorldStore((s) => s.activeWorld);
  const selectedEntityId = useWorldStore((s) => s.selectedEntityId);
  const workspacePath = useWorldStore((s) => s.workspacePath);
  const saving = useWorldStore((s) => s.saving);

  const closePage = useWorldStore((s) => s.closePage);
  const createWorld = useWorldStore((s) => s.createWorld);
  const openWorldByPath = useWorldStore((s) => s.openWorldByPath);
  const deleteWorld = useWorldStore((s) => s.deleteWorld);
  const closeActiveWorld = useWorldStore((s) => s.closeActiveWorld);
  const renameActiveWorld = useWorldStore((s) => s.renameActiveWorld);
  const setActiveWorldview = useWorldStore((s) => s.setActiveWorldview);
  const setSelectedEntity = useWorldStore((s) => s.setSelectedEntity);
  const addEntity = useWorldStore((s) => s.addEntity);
  const removeEntity = useWorldStore((s) => s.removeEntity);

  const openAgentSettings = useWorldAgentSettingsStore((s) => s.openModal);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closePage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, closePage]);

  const entities = activeWorld?.entities ?? [];

  const worldTags = useMemo(
    () => (activeWorld ? collectWorldTags(activeWorld) : []),
    [activeWorld],
  );

  const selectedEntity = useMemo(
    () => activeWorld?.entities.find((entity) => entity.id === selectedEntityId) ?? null,
    [activeWorld, selectedEntityId],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-700 bg-zinc-900 px-4 py-2.5">
        <button
          type="button"
          onClick={closePage}
          className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          ← 返回编辑器
        </button>
        <h1 className="text-sm font-medium text-zinc-200">世界创建器</h1>
        <div className="ml-auto flex items-center gap-2">
          {saving && <span className="text-[10px] text-zinc-500">保存中…</span>}
          <button
            type="button"
            onClick={openAgentSettings}
            className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
          >
            Agent 设置
          </button>
          <WorldSwitcher
            worlds={worlds}
            activeFilePath={activeWorld?.filePath ?? null}
            activeName={activeWorld?.name ?? null}
            onCreate={() => void createWorld()}
            onOpen={(filePath) => void openWorldByPath(filePath)}
            onDelete={(filePath) => void deleteWorld(filePath)}
          />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_22rem] overflow-hidden">
        {activeWorld ? (
          <>
            <section className="flex min-h-0 flex-col overflow-hidden border-r border-zinc-800">
              <div className="shrink-0 space-y-3 border-b border-zinc-800 p-4">
                <div className="flex items-center gap-2">
                  <input
                    key={activeWorld.id}
                    className={`${inputClassName} text-sm font-semibold`}
                    defaultValue={activeWorld.name}
                    onBlur={(e) => void renameActiveWorld(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={closeActiveWorld}
                    className="shrink-0 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    关闭
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">世界观描述</label>
                  <AiTextField
                    key={`worldview-${activeWorld.id}`}
                    fieldId="world.worldview"
                    label="世界观描述"
                    value={activeWorld.worldview}
                    onChange={(val) => void setActiveWorldview(val)}
                    multiline
                    rows={4}
                    placeholder="描述这个世界的整体设定、规则与基调…"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">对象（{entities.length}）</span>
                  <button
                    type="button"
                    onClick={() => void addEntity()}
                    className="rounded bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700"
                  >
                    + 新建对象
                  </button>
                </div>
                {entities.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-zinc-600">
                    暂无对象，点击右上角新建。
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {entities.map((entity) => (
                      <li key={entity.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedEntity(entity.id)}
                          className={`flex w-full flex-col gap-1 rounded px-2.5 py-1.5 text-left ${
                            entity.id === selectedEntityId
                              ? "bg-zinc-800"
                              : "hover:bg-zinc-800/60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-zinc-100">
                              {entity.name || "未命名"}
                            </span>
                            {entity.summary && (
                              <span className="ml-2 truncate text-[10px] text-zinc-500">
                                {entity.summary}
                              </span>
                            )}
                          </div>
                          {entity.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {entity.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded bg-zinc-700/60 px-1.5 py-0.5 text-[10px] text-zinc-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <EntityEditorPanel
              key={selectedEntity?.id ?? "empty"}
              entity={selectedEntity}
              tagSuggestions={worldTags}
              onChange={(patch) => {
                if (selectedEntity) {
                  void useWorldStore.getState().updateEntity(selectedEntity.id, patch);
                }
              }}
              onDelete={() => {
                if (selectedEntity) void removeEntity(selectedEntity.id);
              }}
            />
          </>
        ) : (
          <div className="col-span-2 flex items-center justify-center px-6 text-center text-sm text-zinc-600">
            {workspacePath
              ? "从右上角下拉框选择或新建一个世界开始创作"
              : "尚未指定软件数据路径，请先在项目管理中选择软件数据路径，再新建世界"}
          </div>
        )}
      </div>

      <WorldAgentSettingsModal />
    </div>
  );
}

interface WorldSwitcherProps {
  worlds: WorldSummary[];
  activeFilePath: string | null;
  activeName: string | null;
  onCreate: () => void;
  onOpen: (filePath: string) => void;
  onDelete: (filePath: string) => void;
}

function WorldSwitcher({
  worlds,
  activeFilePath,
  activeName,
  onCreate,
  onOpen,
  onDelete,
}: WorldSwitcherProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
      >
        <span className="max-w-[12rem] truncate">{activeName ?? "选择世界"}</span>
        <span className="text-[10px] text-zinc-500">▾</span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 w-64 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onCreate();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-blue-400 hover:bg-zinc-800"
          >
            + 新建世界
          </button>
          <div className="border-t border-zinc-800" />
          <div className="max-h-72 overflow-y-auto py-1">
            {worlds.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-zinc-600">暂无世界</p>
            ) : (
              worlds.map((world) => (
                <div
                  key={world.filePath}
                  className={`group flex items-center gap-1 px-1.5 ${
                    world.filePath === activeFilePath ? "bg-zinc-800" : "hover:bg-zinc-800/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpen(world.filePath);
                    }}
                    className="min-w-0 flex-1 px-1.5 py-1.5 text-left"
                  >
                    <div className="truncate text-xs text-zinc-100">{world.name}</div>
                    <div className="truncate text-[10px] text-zinc-500">
                      {world.entityCount} 个对象
                      {world.worldview ? ` · ${world.worldview}` : ""}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(world.filePath)}
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-zinc-500 opacity-0 hover:bg-zinc-700 hover:text-red-400 group-hover:opacity-100"
                    title="删除世界"
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface EntityEditorPanelProps {
  entity: WorldEntity | null;
  tagSuggestions: string[];
  onChange: (patch: Partial<Omit<WorldEntity, "id" | "createdAt">>) => void;
  onDelete: () => void;
}

function EntityEditorPanel({ entity, tagSuggestions, onChange, onDelete }: EntityEditorPanelProps) {
  if (!entity) {
    return (
      <aside className="flex items-center justify-center bg-zinc-900/40 p-4 text-center text-xs text-zinc-600">
        选择或新建一个对象以编辑详情
      </aside>
    );
  }

  return (
    <aside className="flex min-h-0 flex-col overflow-y-auto bg-zinc-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-200">对象详情</span>
        <button
          type="button"
          onClick={onDelete}
          className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
        >
          删除
        </button>
      </div>

      <div className="space-y-3">
        <Field label="名称">
          <AiTextField
            fieldId="world.entity.name"
            label="对象名称"
            value={entity.name}
            onChange={(val) => onChange({ name: val.trim() || "新对象" })}
          />
        </Field>
        <Field label="标签">
          <TagEditor
            tags={entity.tags}
            suggestions={tagSuggestions}
            onChange={(tags) => onChange({ tags })}
          />
        </Field>
        <Field label="功能 / 概要">
          <AiTextField
            fieldId="world.entity.summary"
            label="功能 / 概要"
            value={entity.summary}
            onChange={(val) => onChange({ summary: val })}
          />
        </Field>
        <Field label="描述">
          <AiTextField
            fieldId="world.entity.description"
            label="对象描述"
            value={entity.description}
            onChange={(val) => onChange({ description: val })}
            multiline
            rows={4}
          />
        </Field>
        <Field label="背景故事">
          <AiTextField
            fieldId="world.entity.backstory"
            label="背景故事"
            value={entity.backstory}
            onChange={(val) => onChange({ backstory: val })}
            multiline
            rows={6}
          />
        </Field>
      </div>
    </aside>
  );
}

interface TagEditorProps {
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}

function TagEditor({ tags, suggestions, onChange }: TagEditorProps) {
  const [input, setInput] = useState("");

  const commitInput = () => {
    const parsed = parseTags(input);
    if (parsed.length > 0) {
      onChange(dedupeTags([...tags, ...parsed]));
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((existing) => existing !== tag));
  };

  const addTag = (tag: string) => {
    onChange(dedupeTags([...tags, tag]));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "," || event.key === "，") {
      event.preventDefault();
      commitInput();
    } else if (event.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const available = suggestions.filter(
    (suggestion) => !tags.some((tag) => tag.toLowerCase() === suggestion.toLowerCase()),
  );

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1 rounded border border-zinc-600 bg-zinc-800 px-1.5 py-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-zinc-400 hover:text-red-400"
              title="移除标签"
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="h-6 min-w-[6rem] flex-1 bg-transparent px-1 text-xs text-zinc-100 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitInput}
          placeholder={tags.length === 0 ? "输入标签，回车或逗号添加" : "添加…"}
        />
      </div>
      {available.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] text-zinc-500">复用：</span>
          {available.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:border-blue-500 hover:text-blue-400"
            >
              # {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
