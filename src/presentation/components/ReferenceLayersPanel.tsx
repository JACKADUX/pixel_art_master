import { useCallback, useEffect, useRef, useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";

import { canRemoveLayer } from "@/domain/layer/LayerOperations";
import { isReferenceLayer } from "@/domain/layer/LayerTypeGuards";

import { useAppStore } from "../stores/appStore";

import { EyeIcon, EyeOffIcon, TrashIcon } from "./LayerPanelIcons";
import { ReferenceLayerMoreMenu } from "./ReferenceLayerMoreMenu";

const DRAG_THRESHOLD_PX = 4;

function computeDropDisplayIndex(
  clientY: number,
  listElement: HTMLElement,
): number {
  const items = listElement.querySelectorAll<HTMLElement>("[data-layer-item]");
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return i;
    }
  }
  return items.length;
}

export function ReferenceLayersPanel() {
  const project = useAppStore((s) => s.project);
  const setActiveReferenceLayer = useAppStore((s) => s.setActiveReferenceLayer);
  const toggleLayerVisibility = useAppStore((s) => s.toggleLayerVisibility);
  const renameLayer = useAppStore((s) => s.renameLayer);
  const addReferenceLayer = useAppStore((s) => s.addReferenceLayer);
  const removeLayer = useAppStore((s) => s.removeLayer);
  const reorderLayer = useAppStore((s) => s.reorderLayer);
  const importImageToReferenceLayer = useAppStore((s) => s.importImageToReferenceLayer);
  const openCropEditor = useAppStore((s) => s.openCropEditor);
  const toggleReferenceGrid = useAppStore((s) => s.toggleReferenceGrid);

  const panelRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [draggingDisplayIndex, setDraggingDisplayIndex] = useState<number | null>(null);
  const [dropDisplayIndex, setDropDisplayIndex] = useState<number | null>(null);

  const listRef = useRef<HTMLUListElement>(null);
  const draggingRef = useRef<number | null>(null);
  const dropDisplayIndexRef = useRef<number | null>(null);
  const pendingDragRef = useRef<{ displayIndex: number; startX: number; startY: number } | null>(
    null,
  );

  const handleStartRename = (layerId: string, currentName: string) => {
    setEditingId(layerId);
    setEditName(currentName);
  };

  const handleCommitRename = (layerId: string) => {
    if (editName.trim()) {
      renameLayer(layerId, editName);
    }
    setEditingId(null);
    setEditName("");
  };

  const commitReorder = useCallback(
    (fromDisplay: number, toDisplay: number, referenceCount: number) => {
      if (fromDisplay === toDisplay) return;
      const fromRealIndex = referenceCount - 1 - fromDisplay;
      const toRealIndex = referenceCount - 1 - toDisplay;
      reorderLayer(fromRealIndex, toRealIndex);
    },
    [reorderLayer],
  );

  const stopDragging = useCallback(() => {
    pendingDragRef.current = null;
    draggingRef.current = null;
    dropDisplayIndexRef.current = null;
    setIsDragging(false);
    setDraggingDisplayIndex(null);
    setDropDisplayIndex(null);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  const handleDragHandlePointerDown = (
    displayIndex: number,
    e: React.PointerEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    pendingDragRef.current = { displayIndex, startX: e.clientX, startY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!project) return;

    const referenceLayers = project.canvas.layers.filter((layer) => layer.type === "reference");
    const referenceCount = referenceLayers.length;
    const reversedLayers = [...referenceLayers].reverse();

    const onPointerMove = (e: PointerEvent) => {
      const pending = pendingDragRef.current;
      if (pending && !isDragging) {
        const dx = e.clientX - pending.startX;
        const dy = e.clientY - pending.startY;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

        draggingRef.current = pending.displayIndex;
        dropDisplayIndexRef.current = pending.displayIndex;
        setIsDragging(true);
        setDraggingDisplayIndex(pending.displayIndex);
        setDropDisplayIndex(pending.displayIndex);
        document.body.style.cursor = "grabbing";
        pendingDragRef.current = null;
      }

      if (!isDragging || !listRef.current || draggingRef.current === null) return;
      const draggedLayer = reversedLayers[draggingRef.current];
      if (!draggedLayer) return;
      const rawIndex = computeDropDisplayIndex(e.clientY, listRef.current);
      const index = Math.max(0, Math.min(rawIndex, referenceCount));
      dropDisplayIndexRef.current = index;
      setDropDisplayIndex(index);
    };

    const onPointerUp = () => {
      if (pendingDragRef.current) {
        pendingDragRef.current = null;
        document.body.style.userSelect = "";
        return;
      }

      if (!isDragging) return;

      const from = draggingRef.current;
      const to = dropDisplayIndexRef.current;
      if (from !== null && to !== null) {
        commitReorder(from, to, referenceCount);
      }
      stopDragging();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isDragging, project, commitReorder, stopDragging]);

  if (!project) return null;

  const { layers, activeReferenceLayerId } = project.canvas;
  const referenceLayers = layers.filter((layer) => isReferenceLayer(layer));
  const displayLayers = [...referenceLayers].reverse();

  return (
    <div ref={panelRef} className="flex h-full min-w-0 w-full flex-col">
      <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-2">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <h3 className="text-sm font-medium text-zinc-300">
            参考层 ({referenceLayers.length})
          </h3>
          <ReferenceLayerMoreMenu />
        </div>
        <p className="mb-2 px-1 text-[10px] text-zinc-500">
          拖拽手柄调整参考层顺序；选中后可拖拽移动，不可绘制。侧栏激活时 Ctrl+V 从剪贴板导入
        </p>
        {displayLayers.length === 0 ? (
          <p className="px-1 text-xs text-zinc-500">暂无参考层</p>
        ) : (
          <ul ref={listRef} className="flex w-full min-w-0 flex-col gap-1">
            {dropDisplayIndex === 0 && isDragging && (
              <li className="h-0.5 shrink-0 rounded-full bg-blue-500" aria-hidden />
            )}
            {displayLayers.map((layer, displayIndex) => {
              const isActive = layer.id === activeReferenceLayerId;
              const removable = canRemoveLayer(layers, layer.id);
              const isBeingDragged = draggingDisplayIndex === displayIndex;

              return (
                <li key={layer.id} data-layer-item className="w-full min-w-0">
                  {dropDisplayIndex === displayIndex &&
                    isDragging &&
                    displayIndex > 0 && (
                      <div className="mb-1 h-0.5 rounded-full bg-blue-500" aria-hidden />
                    )}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveReferenceLayer(layer.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveReferenceLayer(layer.id);
                      }
                    }}
                    className={`flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded border px-2 py-1.5 transition ${
                      isBeingDragged ? "opacity-50" : ""
                    } ${
                      isActive
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                    }`}
                  >
                    <button
                      type="button"
                      title="拖拽调整层级"
                      onPointerDown={(e) => handleDragHandlePointerDown(displayIndex, e)}
                      className="shrink-0 cursor-grab touch-none text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
                    >
                      <Bars3Icon className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      title={layer.visible ? "隐藏图层" : "显示图层"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                      }}
                      className="shrink-0 text-zinc-400 hover:text-zinc-200"
                    >
                      {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
                    </button>

                    <div
                      className="min-w-0 flex-1 text-left"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(layer.id, layer.name);
                      }}
                    >
                      {editingId === layer.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleCommitRename(layer.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCommitRename(layer.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="w-full rounded border border-zinc-600 bg-zinc-900 px-1 py-0.5 text-xs text-zinc-100"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="block truncate text-xs text-zinc-200">
                          {layer.name}
                        </span>
                      )}
                    </div>

                    <div
                      className="flex shrink-0 flex-col gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!layer.imageData ? (
                        <button
                          type="button"
                          title="导入图片"
                          onClick={() => importImageToReferenceLayer(layer.id)}
                          className="text-[10px] text-blue-400 hover:text-blue-300"
                        >
                          导入
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            title="裁剪"
                            onClick={() => openCropEditor(layer.id)}
                            className="text-[10px] text-blue-400 hover:text-blue-300"
                          >
                            裁剪
                          </button>
                          <button
                            type="button"
                            title={layer.grid.visible ? "关闭网格" : "开启网格"}
                            onClick={() => toggleReferenceGrid(layer.id)}
                            className={`text-[10px] ${layer.grid.visible ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"}`}
                          >
                            网格
                          </button>
                        </>
                      )}
                    </div>

                    {isActive && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-blue-400"
                        title="活动参考层"
                      />
                    )}

                    {removable && (
                      <button
                        type="button"
                        title="删除图层"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLayer(layer.id);
                        }}
                        className="shrink-0 text-zinc-500 hover:text-red-400"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
            {dropDisplayIndex === displayLayers.length && isDragging && (
              <li className="h-0.5 shrink-0 rounded-full bg-blue-500" aria-hidden />
            )}
          </ul>
        )}
      </div>

      <div className="flex w-full min-w-0 shrink-0 flex-col gap-1 border-t border-zinc-700 p-2">
        <div className="flex w-full min-w-0 gap-1">
          <button
            type="button"
            onClick={() => addReferenceLayer()}
            className="flex-1 rounded bg-zinc-700 px-2 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600"
          >
            + 参考层
          </button>
          {activeReferenceLayerId &&
            canRemoveLayer(layers, activeReferenceLayerId) && (
              <button
                type="button"
                onClick={() => removeLayer(activeReferenceLayerId)}
                className="rounded px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-zinc-700"
              >
                删除
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
