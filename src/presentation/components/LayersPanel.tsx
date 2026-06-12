import { useCallback, useEffect, useRef, useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";

import { canRemoveLayer } from "@/domain/layer/LayerOperations";
import { countReferenceLayers } from "@/domain/layer/LayerStack";

import { useAppStore } from "../stores/appStore";

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

function clampDropDisplayIndex(
  dropIndex: number,
  layerCount: number,
  referenceCount: number,
  draggedType: "reference" | "drawing",
): number {
  const drawingCount = layerCount - referenceCount;
  if (draggedType === "reference") {
    return Math.max(drawingCount, Math.min(dropIndex, layerCount));
  }
  return Math.max(0, Math.min(dropIndex, drawingCount));
}

export function LayersPanel() {
  const project = useAppStore((s) => s.project);
  const setActiveLayer = useAppStore((s) => s.setActiveLayer);
  const toggleLayerVisibility = useAppStore((s) => s.toggleLayerVisibility);
  const renameLayer = useAppStore((s) => s.renameLayer);
  const addDrawingLayer = useAppStore((s) => s.addDrawingLayer);
  const addReferenceLayer = useAppStore((s) => s.addReferenceLayer);
  const removeLayer = useAppStore((s) => s.removeLayer);
  const reorderLayer = useAppStore((s) => s.reorderLayer);
  const importImageToReferenceLayer = useAppStore((s) => s.importImageToReferenceLayer);
  const openCropEditor = useAppStore((s) => s.openCropEditor);
  const toggleReferenceGrid = useAppStore((s) => s.toggleReferenceGrid);

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
    (fromDisplay: number, toDisplay: number, layerCount: number) => {
      if (fromDisplay === toDisplay) return;
      const fromRealIndex = layerCount - 1 - fromDisplay;
      const toRealIndex = layerCount - 1 - toDisplay;
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

    const layerCount = project.canvas.layers.length;
    const reversedLayers = [...project.canvas.layers].reverse();

    const onPointerMove = (e: PointerEvent) => {
      if (!listRef.current || draggingRef.current === null) return;
      const draggedLayer = reversedLayers[draggingRef.current];
      if (!draggedLayer) return;
      const referenceCount = countReferenceLayers(project.canvas.layers);
      const rawIndex = computeDropDisplayIndex(e.clientY, listRef.current);
      const index = clampDropDisplayIndex(
        rawIndex,
        layerCount,
        referenceCount,
        draggedLayer.type,
      );
      dropDisplayIndexRef.current = index;
      setDropDisplayIndex(index);
    };

    const onPointerUp = () => {
      const from = draggingRef.current;
      const to = dropDisplayIndexRef.current;
      if (from !== null && to !== null) {
        commitReorder(from, to, layerCount);
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
  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const activeIsReference = activeLayer?.type === "reference";
  const displayLayers = [...layers].reverse();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-2">
        <h3 className="mb-2 px-1 text-sm font-medium text-zinc-300">
          图层 ({layers.length})
        </h3>
        <p className="mb-2 px-1 text-[10px] text-zinc-500">
          拖拽手柄调整同类型图层顺序；参考层始终显示在绘制层上方
        </p>
        <ul ref={listRef} className="flex flex-col gap-1">
          {dropDisplayIndex === 0 && isDragging && (
            <li className="h-0.5 shrink-0 rounded-full bg-blue-500" aria-hidden />
          )}
          {displayLayers.map((layer, displayIndex) => {
            const isActive = layer.id === activeLayerId;
            const removable = canRemoveLayer(layers, layer.id);
            const isBeingDragged = draggingDisplayIndex === displayIndex;

            return (
              <li key={layer.id} data-layer-item>
                {dropDisplayIndex === displayIndex &&
                  isDragging &&
                  displayIndex > 0 && (
                    <div className="mb-1 h-0.5 rounded-full bg-blue-500" aria-hidden />
                  )}
                <div
                  className={`flex items-center gap-1.5 rounded border px-2 py-1.5 transition ${
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
                    <span className="text-[10px] text-zinc-500">
                      {layer.type === "reference" ? "参考" : "绘制"}
                    </span>
                  </button>

                  {layer.type === "reference" && (
                    <div className="flex shrink-0 flex-col gap-0.5">
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
                  )}

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

      <div className="flex flex-col gap-1 border-t border-zinc-700 p-2">
        {activeIsReference && (
          <p className="px-1 text-[10px] text-zinc-500">
            参考层 — 拖拽移动，不可绘制
          </p>
        )}

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => addReferenceLayer()}
            className="flex-1 rounded bg-zinc-700 px-2 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600"
          >
            + 参考层
          </button>
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

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
      <path d="M10.748 13.93l1.092 1.092A9.953 9.953 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41a1.642 1.642 0 01-.83-1.467l1.076-1.076a10.03 10.03 0 002.668 4.01z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
  );
}
