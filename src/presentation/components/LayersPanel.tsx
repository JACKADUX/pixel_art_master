import { useCallback, useEffect, useRef, useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";

import { canRemoveLayer } from "@/domain/layer/LayerOperations";
import { countReferenceLayers } from "@/domain/layer/LayerStack";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";

import { useAppStore } from "../stores/appStore";

import { EyeIcon, EyeOffIcon, TrashIcon } from "./LayerPanelIcons";

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

export function LayersPanel() {
  const project = useAppStore((s) => s.project);
  const setActiveLayer = useAppStore((s) => s.setActiveLayer);
  const toggleLayerVisibility = useAppStore((s) => s.toggleLayerVisibility);
  const renameLayer = useAppStore((s) => s.renameLayer);
  const addDrawingLayer = useAppStore((s) => s.addDrawingLayer);
  const removeLayer = useAppStore((s) => s.removeLayer);
  const reorderLayer = useAppStore((s) => s.reorderLayer);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [draggingDisplayIndex, setDraggingDisplayIndex] = useState<number | null>(null);
  const [dropDisplayIndex, setDropDisplayIndex] = useState<number | null>(null);

  const listRef = useRef<HTMLUListElement>(null);
  const draggingRef = useRef<number | null>(null);
  const dropDisplayIndexRef = useRef<number | null>(null);

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
    (fromDisplay: number, toDisplay: number, referenceCount: number, drawingCount: number) => {
      if (fromDisplay === toDisplay) return;
      const fromRealIndex = referenceCount + (drawingCount - 1 - fromDisplay);
      const toRealIndex = referenceCount + (drawingCount - 1 - toDisplay);
      reorderLayer(fromRealIndex, toRealIndex);
    },
    [reorderLayer],
  );

  const stopDragging = useCallback(() => {
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
    draggingRef.current = displayIndex;
    dropDisplayIndexRef.current = displayIndex;
    setIsDragging(true);
    setDraggingDisplayIndex(displayIndex);
    setDropDisplayIndex(displayIndex);
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  useEffect(() => {
    if (!isDragging || !project) return;

    const referenceCount = countReferenceLayers(project.canvas.layers);
    const drawingLayers = project.canvas.layers.filter((layer) => isDrawingLayer(layer));
    const drawingCount = drawingLayers.length;
    const reversedLayers = [...drawingLayers].reverse();

    const onPointerMove = (e: PointerEvent) => {
      if (!listRef.current || draggingRef.current === null) return;
      const draggedLayer = reversedLayers[draggingRef.current];
      if (!draggedLayer) return;
      const rawIndex = computeDropDisplayIndex(e.clientY, listRef.current);
      const index = Math.max(0, Math.min(rawIndex, drawingCount));
      dropDisplayIndexRef.current = index;
      setDropDisplayIndex(index);
    };

    const onPointerUp = () => {
      const from = draggingRef.current;
      const to = dropDisplayIndexRef.current;
      if (from !== null && to !== null) {
        commitReorder(from, to, referenceCount, drawingCount);
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

  const { layers, activeLayerId } = project.canvas;
  const drawingLayers = layers.filter((layer) => isDrawingLayer(layer));
  const displayLayers = [...drawingLayers].reverse();

  return (
    <div className="flex h-full min-w-0 w-full flex-col">
      <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-2">
        <h3 className="mb-2 px-1 text-sm font-medium text-zinc-300">
          绘制层 ({drawingLayers.length})
        </h3>
        <p className="mb-2 px-1 text-[10px] text-zinc-500">
          拖拽手柄调整绘制层顺序
        </p>
        <ul ref={listRef} className="flex w-full min-w-0 flex-col gap-1">
          {dropDisplayIndex === 0 && isDragging && (
            <li className="h-0.5 shrink-0 rounded-full bg-blue-500" aria-hidden />
          )}
          {displayLayers.map((layer, displayIndex) => {
            const isActive = layer.id === activeLayerId;
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
                  className={`flex w-full min-w-0 items-center gap-1.5 rounded border px-2 py-1.5 transition ${
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
                    onClick={() => toggleLayerVisibility(layer.id)}
                    className="shrink-0 text-zinc-400 hover:text-zinc-200"
                  >
                    {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
                  </button>

                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setActiveLayer(layer.id)}
                    onDoubleClick={() => handleStartRename(layer.id, layer.name)}
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
                  </button>

                  {isActive && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-blue-400"
                      title="活动图层"
                    />
                  )}

                  {removable && (
                    <button
                      type="button"
                      title="删除图层"
                      onClick={() => removeLayer(layer.id)}
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
      </div>

      <div className="flex w-full min-w-0 shrink-0 flex-col gap-1 border-t border-zinc-700 p-2">
        <div className="flex w-full min-w-0 gap-1">
          <button
            type="button"
            onClick={() => addDrawingLayer()}
            className="flex-1 rounded bg-zinc-700 px-2 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600"
          >
            + 绘制层
          </button>
          {activeLayerId && canRemoveLayer(layers, activeLayerId) && (
            <button
              type="button"
              onClick={() => removeLayer(activeLayerId)}
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
