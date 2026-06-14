import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CropRect } from "@/domain/layer/Layer";
import { clampCropRect } from "@/domain/layer/ReferenceLayerOperations";
import {
  hitTestSeedCornerHandle,
  normalizeSeedRect,
  resizeSeedFromCornerHandle,
  SEED_CORNER_HANDLE_SIZE_PX,
  type SeedCornerHandle,
} from "@/domain/pixelRestore/GridCellOperations";
import {
  computeGridLayout,
  computeGridOverlayLineIndices,
} from "@/domain/pixelRestore/GridRestoreOperations";
import {
  computeRegionGridLayout,
  getRegionCellRect,
  isOuterRegionGridCell,
  type RegionGridLayout,
} from "@/domain/pixelRestore/RegionGridRestoreOperations";
import type { GridScaleType } from "@/domain/pixelRestore/GridScaleType";
import { usePixelRestoreStore } from "../../stores/pixelRestoreStore";
import { formatZoomLabel } from "../imagePreview/imagePreviewUtils";
import {
  canvasClientToImage,
  useImagePreviewViewport,
} from "../imagePreview/useImagePreviewViewport";
import { useGridLayout, useRegionGridLayout } from "./useGridLayout";

function normalizeRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
): CropRect {
  return normalizeSeedRect(a, b);
}

function drawCornerHandle(
  ctx: CanvasRenderingContext2D,
  imageX: number,
  imageY: number,
  zoom: number,
) {
  const hx = imageX * zoom;
  const hy = imageY * zoom;
  const size = SEED_CORNER_HANDLE_SIZE_PX;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1;
  ctx.strokeRect(hx - size / 2 + 0.5, hy - size / 2 + 0.5, size - 1, size - 1);
}

function drawSelectionRect(
  ctx: CanvasRenderingContext2D,
  activeRect: CropRect,
  zoom: number,
) {
  const x = activeRect.x * zoom;
  const y = activeRect.y * zoom;
  const w = activeRect.width * zoom;
  const h = activeRect.height * zoom;

  ctx.fillStyle = "rgba(59, 130, 246, 0.18)";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));

  drawCornerHandle(ctx, activeRect.x, activeRect.y, zoom);
  drawCornerHandle(
    ctx,
    activeRect.x + activeRect.width,
    activeRect.y + activeRect.height,
    zoom,
  );
}

function drawSingleCellGridOverlay(
  ctx: CanvasRenderingContext2D,
  imageSize: { width: number; height: number },
  seedCell: CropRect,
  zoom: number,
  displayWidth: number,
  displayHeight: number,
) {
  const layout = computeGridLayout(imageSize, seedCell);
  if (!layout) return;

  ctx.strokeStyle = "rgba(96, 165, 250, 0.45)";
  ctx.lineWidth = 1;

  const columnIndices = computeGridOverlayLineIndices(
    seedCell.x,
    seedCell.width,
    imageSize.width,
  );
  for (const col of columnIndices) {
    const x = (seedCell.x + col * seedCell.width) * zoom + 0.5;
    if (x < 0 || x > displayWidth) continue;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, displayHeight);
    ctx.stroke();
  }

  const rowIndices = computeGridOverlayLineIndices(
    seedCell.y,
    seedCell.height,
    imageSize.height,
  );
  for (const row of rowIndices) {
    const y = (seedCell.y + row * seedCell.height) * zoom + 0.5;
    if (y < 0 || y > displayHeight) continue;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(displayWidth, y);
    ctx.stroke();
  }
}

function drawRegionOuterCellRing(
  ctx: CanvasRenderingContext2D,
  layout: RegionGridLayout,
  zoom: number,
) {
  ctx.fillStyle = "rgba(59, 130, 246, 0.08)";

  for (let row = 0; row < layout.totalRows; row++) {
    for (let col = 0; col < layout.totalColumns; col++) {
      if (!isOuterRegionGridCell(col, row, layout.totalColumns, layout.totalRows)) continue;

      const cell = getRegionCellRect(
        layout.region,
        col,
        row,
        layout.totalColumns,
        layout.totalRows,
      );
      ctx.fillRect(cell.x * zoom, cell.y * zoom, cell.width * zoom, cell.height * zoom);
    }
  }

  const bx = layout.region.x * zoom;
  const by = layout.region.y * zoom;
  const bw = layout.region.width * zoom;
  const bh = layout.region.height * zoom;

  ctx.strokeStyle = "rgba(96, 165, 250, 0.55)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(bx + 0.5, by + 0.5, Math.max(0, bw - 1), Math.max(0, bh - 1));
  ctx.setLineDash([]);
}

function drawRegionGridOverlay(
  ctx: CanvasRenderingContext2D,
  region: CropRect,
  columns: number,
  rows: number,
  zoom: number,
) {
  ctx.strokeStyle = "rgba(96, 165, 250, 0.45)";
  ctx.lineWidth = 1;

  const rx = region.x * zoom;
  const ry = region.y * zoom;
  const rw = region.width * zoom;
  const rh = region.height * zoom;

  for (let col = 0; col <= columns; col++) {
    const cell = getRegionCellRect(region, col, 0, columns, rows);
    const x = cell.x * zoom + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, ry);
    ctx.lineTo(x, ry + rh);
    ctx.stroke();
  }

  for (let row = 0; row <= rows; row++) {
    const cell = getRegionCellRect(region, 0, row, columns, rows);
    const y = cell.y * zoom + 0.5;
    ctx.beginPath();
    ctx.moveTo(rx, y);
    ctx.lineTo(rx + rw, y);
    ctx.stroke();
  }
}

function drawGridOverlay(
  ctx: CanvasRenderingContext2D,
  imageSize: { width: number; height: number },
  gridScaleType: GridScaleType,
  seedCell: CropRect | null,
  region: CropRect | null,
  columnCount: number,
  rowCount: number,
  marquee: CropRect | null,
  zoom: number,
  displayWidth: number,
  displayHeight: number,
) {
  ctx.clearRect(0, 0, displayWidth, displayHeight);

  const committedRect = gridScaleType === "singleCell" ? seedCell : region;
  const activeRect = marquee ?? committedRect;

  if (gridScaleType === "singleCell" && seedCell && !marquee) {
    drawSingleCellGridOverlay(ctx, imageSize, seedCell, zoom, displayWidth, displayHeight);
  }

  if (gridScaleType === "region" && region && !marquee) {
    const layout = computeRegionGridLayout(region, columnCount, rowCount);
    if (layout) {
      drawRegionOuterCellRing(ctx, layout, zoom);
      drawRegionGridOverlay(
        ctx,
        layout.region,
        layout.totalColumns,
        layout.totalRows,
        zoom,
      );
    }
  }

  if (activeRect) {
    drawSelectionRect(ctx, activeRect, zoom);
  }
}

export function GridRestoreSourcePreview() {
  const sourceImageData = usePixelRestoreStore((s) => s.sourceImageData);
  const restoreMode = usePixelRestoreStore((s) => s.restoreMode);
  const gridScaleType = usePixelRestoreStore((s) => s.gridScaleType);
  const gridSeedCell = usePixelRestoreStore((s) => s.gridSeedCell);
  const gridRegion = usePixelRestoreStore((s) => s.gridRegion);
  const gridColumnCount = usePixelRestoreStore((s) => s.gridColumnCount);
  const gridRowCount = usePixelRestoreStore((s) => s.gridRowCount);
  const gridCreateActive = usePixelRestoreStore((s) => s.gridCreateActive);
  const beginGridDrawing = usePixelRestoreStore((s) => s.beginGridDrawing);
  const commitGridSeedCell = usePixelRestoreStore((s) => s.commitGridSeedCell);
  const commitGridRegion = usePixelRestoreStore((s) => s.commitGridRegion);
  const setGridSeedCell = usePixelRestoreStore((s) => s.setGridSeedCell);
  const setGridRegion = usePixelRestoreStore((s) => s.setGridRegion);
  const adjustGridCounts = usePixelRestoreStore((s) => s.adjustGridCounts);
  const cancelGrid = usePixelRestoreStore((s) => s.cancelGrid);

  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const selectRef = useRef<{ start: { x: number; y: number }; current: { x: number; y: number } } | null>(null);
  const handleDragRef = useRef<SeedCornerHandle | null>(null);
  const [marquee, setMarquee] = useState<CropRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isHandleDragging, setIsHandleDragging] = useState(false);

  const gridEnabled = restoreMode === "gridScale";

  const shouldHandleWheelZoom = useCallback(
    (event: WheelEvent) => {
      if (gridEnabled && gridScaleType === "region") {
        return !event.shiftKey && !event.ctrlKey && !event.metaKey;
      }
      return true;
    },
    [gridEnabled, gridScaleType],
  );

  const viewport = useImagePreviewViewport(sourceImageData, { shouldHandleWheelZoom });
  const {
    containerRef,
    canvasRef,
    zoom,
    zoomRef,
    isPanning,
    isPanningRef,
    stageLayout,
    imageWidth,
    imageHeight,
    displayWidth,
    displayHeight,
    handleContainerMouseDown,
    handleAuxClick,
    stopPanning,
    applyPanMove,
    startPanning,
  } = viewport;

  const committedRect = gridScaleType === "singleCell" ? gridSeedCell : gridRegion;
  const canDrawGrid = gridEnabled && (gridCreateActive || committedRect !== null);

  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !sourceImageData) return;

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!gridEnabled) {
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      return;
    }

    drawGridOverlay(
      ctx,
      { width: sourceImageData.width, height: sourceImageData.height },
      gridScaleType,
      gridSeedCell,
      gridRegion,
      gridColumnCount,
      gridRowCount,
      marquee,
      zoom,
      displayWidth,
      displayHeight,
    );
  }, [
    sourceImageData,
    gridScaleType,
    gridSeedCell,
    gridRegion,
    gridColumnCount,
    gridRowCount,
    marquee,
    zoom,
    displayWidth,
    displayHeight,
    gridEnabled,
  ]);

  useLayoutEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !gridEnabled || gridScaleType !== "region" || !gridRegion) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.shiftKey && !event.ctrlKey && !event.metaKey) return;

      event.preventDefault();
      event.stopPropagation();

      const delta = event.deltaY > 0 ? -1 : 1;
      if (event.shiftKey) {
        adjustGridCounts(delta, 0);
      } else {
        adjustGridCounts(0, delta);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => container.removeEventListener("wheel", handleWheel, { capture: true });
  }, [containerRef, gridEnabled, gridScaleType, gridRegion, adjustGridCounts]);

  useEffect(() => {
    if (!canDrawGrid || !sourceImageData) return;

    const imageSize = { width: sourceImageData.width, height: sourceImageData.height };
    const isRegionMode = gridScaleType === "region";

    const handleMouseMove = (event: MouseEvent) => {
      if (isPanningRef.current) {
        if (event.buttons !== 4) {
          stopPanning();
          return;
        }
        applyPanMove(event.clientX, event.clientY);
        return;
      }

      const canvas = overlayCanvasRef.current;
      if (!canvas) return;

      const handleDrag = handleDragRef.current;
      if (handleDrag) {
        const state = usePixelRestoreStore.getState();
        const currentRect =
          state.gridScaleType === "region" ? state.gridRegion : state.gridSeedCell;
        if (!currentRect) return;
        const point = canvasClientToImage(event.clientX, event.clientY, canvas, zoomRef.current);
        const next = resizeSeedFromCornerHandle(currentRect, handleDrag, point, imageSize);
        if (state.gridScaleType === "region") {
          setGridRegion(next);
        } else {
          setGridSeedCell(next);
        }
        return;
      }

      const selection = selectRef.current;
      if (!selection) return;

      const current = canvasClientToImage(event.clientX, event.clientY, canvas, zoomRef.current);
      selection.current = current;
      setMarquee(
        clampCropRect(
          normalizeRect(selection.start, current),
          imageSize,
        ),
      );
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (isPanningRef.current) {
        stopPanning();
        return;
      }

      if (handleDragRef.current) {
        handleDragRef.current = null;
        setIsHandleDragging(false);
        return;
      }

      const selection = selectRef.current;
      const canvas = overlayCanvasRef.current;
      if (!selection || !canvas) return;

      selectRef.current = null;
      setIsSelecting(false);

      if (event.button !== 0) return;

      const current = canvasClientToImage(event.clientX, event.clientY, canvas, zoomRef.current);
      if (isRegionMode) {
        commitGridRegion(selection.start, current);
      } else {
        commitGridSeedCell(selection.start, current);
      }
      setMarquee(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    canDrawGrid,
    sourceImageData,
    gridScaleType,
    applyPanMove,
    stopPanning,
    commitGridSeedCell,
    commitGridRegion,
    setGridSeedCell,
    setGridRegion,
    isPanningRef,
    zoomRef,
  ]);

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 1) {
      event.preventDefault();
      startPanning(event.clientX, event.clientY);
      return;
    }
    if (event.button === 2) {
      event.preventDefault();
      cancelGrid();
      setMarquee(null);
      selectRef.current = null;
      handleDragRef.current = null;
      setIsSelecting(false);
      setIsHandleDragging(false);
      return;
    }
    if (!canDrawGrid || event.button !== 0) return;

    const canvas = overlayCanvasRef.current;
    if (!canvas || !sourceImageData) return;

    if (committedRect && !isSelecting) {
      const point = canvasClientToImage(event.clientX, event.clientY, canvas, zoom);
      const handle = hitTestSeedCornerHandle(point, committedRect, zoom);
      if (handle) {
        event.preventDefault();
        handleDragRef.current = handle;
        setIsHandleDragging(true);
        return;
      }
    }

    event.preventDefault();
    beginGridDrawing();
    const start = canvasClientToImage(event.clientX, event.clientY, canvas, zoom);
    selectRef.current = { start, current: start };
    setIsSelecting(true);
    setMarquee(
      clampCropRect(
        normalizeRect(start, start),
        { width: sourceImageData.width, height: sourceImageData.height },
      ),
    );
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (gridEnabled) {
      cancelGrid();
      setMarquee(null);
      selectRef.current = null;
      handleDragRef.current = null;
      setIsSelecting(false);
      setIsHandleDragging(false);
    }
  };

  const singleLayout = useGridLayout();
  const regionLayout = useRegionGridLayout();

  const headerGridLabel =
    gridScaleType === "singleCell" && singleLayout
      ? `网格 ${singleLayout.columns}×${singleLayout.rows}`
      : gridScaleType === "region" && regionLayout
        ? `网格 ${regionLayout.columns}×${regionLayout.rows} → ${regionLayout.outputWidth}×${regionLayout.outputHeight}`
        : null;

  const footerHint =
    gridScaleType === "singleCell"
      ? "左键框选基准格 · 拖拽角点 · 方向键微调 · Shift+方向键调右下角 · 右键取消 · Enter 应用"
      : "左键框选区域 · 拖拽角点 · Shift+滚轮调 X · Ctrl+滚轮调 Y · 方向键移动 · Shift+方向键调大小 · 右键取消 · Enter 应用";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center border-b border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
        <span>原图</span>
        {sourceImageData && (
          <span className="ml-2 text-zinc-600">
            {imageWidth} × {imageHeight}
          </span>
        )}
        {headerGridLabel && (
          <span className="ml-2 text-zinc-500">{headerGridLabel}</span>
        )}
        {sourceImageData && (
          <span className="ml-auto text-zinc-600">{formatZoomLabel(zoom)}</span>
        )}
      </div>

      <div
        ref={containerRef}
        className={`relative min-h-0 flex-1 overflow-auto overscroll-none bg-zinc-950${
          isPanning ? " cursor-grabbing" : ""
        }`}
        onMouseDown={handleContainerMouseDown}
        onAuxClick={handleAuxClick}
        onMouseUp={stopPanning}
        onMouseLeave={stopPanning}
        onContextMenu={handleContextMenu}
      >
        {!sourceImageData ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">
            暂无图像
          </div>
        ) : (
          stageLayout && (
            <div
              className="relative shrink-0"
              style={{
                width: stageLayout.stageWidth,
                height: stageLayout.stageHeight,
              }}
            >
              <div
                className="absolute"
                style={{
                  left: stageLayout.canvasLeft,
                  top: stageLayout.canvasTop,
                  imageRendering: "pixelated",
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="pointer-events-none block touch-none select-none border border-zinc-800 bg-zinc-900"
                  style={{ imageRendering: "pixelated" }}
                  draggable={false}
                />
                <canvas
                  ref={overlayCanvasRef}
                  className={`absolute left-0 top-0 block touch-none select-none${
                    isSelecting || isHandleDragging
                      ? " cursor-crosshair"
                      : isPanning
                        ? " cursor-grabbing"
                        : canDrawGrid
                          ? " cursor-crosshair"
                          : " cursor-grab"
                  }`}
                  style={{ imageRendering: "pixelated" }}
                  draggable={false}
                  onMouseDown={handleOverlayMouseDown}
                  onAuxClick={handleAuxClick}
                />
              </div>
            </div>
          )
        )}
      </div>

      {gridEnabled && (
        <p className="border-t border-zinc-900 px-3 py-1 text-[10px] text-zinc-600">
          {footerHint}
        </p>
      )}
    </div>
  );
}
