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
import {
  isMiddleMouseButton,
  isMiddleMousePressed,
} from "@/domain/viewport/ViewportPan";
import { usePixelRestoreStore } from "../../stores/pixelRestoreStore";
import { formatZoomLabel } from "../imagePreview/imagePreviewUtils";
import { useImagePreviewViewport } from "../imagePreview/useImagePreviewViewport";
import { useGridLayout, useRegionGridLayout } from "./useGridLayout";

function normalizeRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
): CropRect {
  return normalizeSeedRect(a, b);
}

const GRID_LINE_COLOR = "rgba(56, 189, 248, 0.95)";
const REGION_FILL_COLOR = "rgba(56, 189, 248, 0.14)";
const REGION_BORDER_COLOR = "rgba(125, 211, 252, 1)";
const SELECTION_FILL_COLOR = "rgba(56, 189, 248, 0.22)";
const SELECTION_STROKE_COLOR = "#38bdf8";
const HANDLE_FILL_COLOR = "#ffffff";
const HANDLE_STROKE_COLOR = "#38bdf8";

/**
 * overlay 以视口分辨率绘制，所有几何先从图像坐标映射到「视口内 CSS 像素」坐标，
 * 线宽保持屏幕尺度，因此放大后依然清晰锐利。
 */
interface OverlayTransform {
  /** 图像原点在 overlay 视口内的 CSS 像素偏移（= canvasLeft - scrollLeft） */
  offX: number;
  offY: number;
  zoom: number;
  viewportW: number;
  viewportH: number;
}

function toScreenX(t: OverlayTransform, imageX: number): number {
  return t.offX + imageX * t.zoom;
}

function toScreenY(t: OverlayTransform, imageY: number): number {
  return t.offY + imageY * t.zoom;
}

/** 将坐标对齐到设备像素中心，保证 1px 描边清晰不发虚 */
function crisp(value: number): number {
  return Math.round(value) + 0.5;
}

function drawCornerHandle(
  ctx: CanvasRenderingContext2D,
  t: OverlayTransform,
  imageX: number,
  imageY: number,
) {
  const cx = toScreenX(t, imageX);
  const cy = toScreenY(t, imageY);
  const size = SEED_CORNER_HANDLE_SIZE_PX;
  const half = size / 2;

  ctx.fillStyle = HANDLE_FILL_COLOR;
  ctx.fillRect(cx - half, cy - half, size, size);
  ctx.strokeStyle = HANDLE_STROKE_COLOR;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - half + 0.5, cy - half + 0.5, size - 1, size - 1);
}

function drawSelectionRect(
  ctx: CanvasRenderingContext2D,
  t: OverlayTransform,
  activeRect: CropRect,
) {
  const x = toScreenX(t, activeRect.x);
  const y = toScreenY(t, activeRect.y);
  const w = activeRect.width * t.zoom;
  const h = activeRect.height * t.zoom;

  ctx.fillStyle = SELECTION_FILL_COLOR;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = SELECTION_STROKE_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));

  drawCornerHandle(ctx, t, activeRect.x, activeRect.y);
  drawCornerHandle(
    ctx,
    t,
    activeRect.x + activeRect.width,
    activeRect.y + activeRect.height,
  );
}

function drawSingleCellGridOverlay(
  ctx: CanvasRenderingContext2D,
  t: OverlayTransform,
  imageSize: { width: number; height: number },
  seedCell: CropRect,
) {
  const layout = computeGridLayout(imageSize, seedCell);
  if (!layout) return;

  ctx.strokeStyle = GRID_LINE_COLOR;
  ctx.lineWidth = 1;

  const top = Math.max(0, toScreenY(t, 0));
  const bottom = Math.min(t.viewportH, toScreenY(t, imageSize.height));
  const left = Math.max(0, toScreenX(t, 0));
  const right = Math.min(t.viewportW, toScreenX(t, imageSize.width));

  const columnIndices = computeGridOverlayLineIndices(
    seedCell.x,
    seedCell.width,
    imageSize.width,
  );
  for (const col of columnIndices) {
    const sx = crisp(toScreenX(t, seedCell.x + col * seedCell.width));
    if (sx < 0 || sx > t.viewportW) continue;
    ctx.beginPath();
    ctx.moveTo(sx, top);
    ctx.lineTo(sx, bottom);
    ctx.stroke();
  }

  const rowIndices = computeGridOverlayLineIndices(
    seedCell.y,
    seedCell.height,
    imageSize.height,
  );
  for (const row of rowIndices) {
    const sy = crisp(toScreenY(t, seedCell.y + row * seedCell.height));
    if (sy < 0 || sy > t.viewportH) continue;
    ctx.beginPath();
    ctx.moveTo(left, sy);
    ctx.lineTo(right, sy);
    ctx.stroke();
  }
}

function drawRegionOuterCellRing(
  ctx: CanvasRenderingContext2D,
  t: OverlayTransform,
  layout: RegionGridLayout,
) {
  ctx.fillStyle = REGION_FILL_COLOR;

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
      ctx.fillRect(
        toScreenX(t, cell.x),
        toScreenY(t, cell.y),
        cell.width * t.zoom,
        cell.height * t.zoom,
      );
    }
  }

  const bx = toScreenX(t, layout.region.x);
  const by = toScreenY(t, layout.region.y);
  const bw = layout.region.width * t.zoom;
  const bh = layout.region.height * t.zoom;

  ctx.strokeStyle = REGION_BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(bx + 0.5, by + 0.5, Math.max(0, bw - 1), Math.max(0, bh - 1));
  ctx.setLineDash([]);
}

function drawRegionGridOverlay(
  ctx: CanvasRenderingContext2D,
  t: OverlayTransform,
  region: CropRect,
  columns: number,
  rows: number,
) {
  ctx.strokeStyle = GRID_LINE_COLOR;
  ctx.lineWidth = 1;

  const ry = toScreenY(t, region.y);
  const rh = region.height * t.zoom;
  const rx = toScreenX(t, region.x);
  const rw = region.width * t.zoom;

  for (let col = 0; col <= columns; col++) {
    const cell = getRegionCellRect(region, col, 0, columns, rows);
    const sx = crisp(toScreenX(t, cell.x));
    ctx.beginPath();
    ctx.moveTo(sx, ry);
    ctx.lineTo(sx, ry + rh);
    ctx.stroke();
  }

  for (let row = 0; row <= rows; row++) {
    const cell = getRegionCellRect(region, 0, row, columns, rows);
    const sy = crisp(toScreenY(t, cell.y));
    ctx.beginPath();
    ctx.moveTo(rx, sy);
    ctx.lineTo(rx + rw, sy);
    ctx.stroke();
  }
}

function drawGridOverlay(
  ctx: CanvasRenderingContext2D,
  t: OverlayTransform,
  imageSize: { width: number; height: number },
  gridScaleType: GridScaleType,
  seedCell: CropRect | null,
  region: CropRect | null,
  columnCount: number,
  rowCount: number,
  marquee: CropRect | null,
) {
  const committedRect = gridScaleType === "singleCell" ? seedCell : region;
  const activeRect = marquee ?? committedRect;

  if (gridScaleType === "singleCell" && seedCell && !marquee) {
    drawSingleCellGridOverlay(ctx, t, imageSize, seedCell);
  }

  if (gridScaleType === "region" && region && !marquee) {
    const layout = computeRegionGridLayout(region, columnCount, rowCount);
    if (layout) {
      drawRegionOuterCellRing(ctx, t, layout);
      drawRegionGridOverlay(
        ctx,
        t,
        layout.region,
        layout.totalColumns,
        layout.totalRows,
      );
    }
  }

  if (activeRect) {
    drawSelectionRect(ctx, t, activeRect);
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
    handleContainerMouseDown,
    handleAuxClick,
    stopPanning,
    applyPanMove,
    startPanning,
  } = viewport;

  const stageLayoutRef = useRef(stageLayout);
  stageLayoutRef.current = stageLayout;

  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const committedRect = gridScaleType === "singleCell" ? gridSeedCell : gridRegion;
  const canDrawGrid = gridEnabled && (gridCreateActive || committedRect !== null);

  /** client 坐标 → 图像像素坐标（基于滚动容器，与 overlay 是否平移无关） */
  const clientToImage = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      const layout = stageLayoutRef.current;
      if (!container || !layout) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const z = zoomRef.current || 1;
      return {
        x: Math.floor((clientX - rect.left + container.scrollLeft - layout.canvasLeft) / z),
        y: Math.floor((clientY - rect.top + container.scrollTop - layout.canvasTop) / z),
      };
    },
    [containerRef, zoomRef],
  );

  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const viewportW = container.clientWidth;
    const viewportH = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const backingW = Math.max(1, Math.round(viewportW * dpr));
    const backingH = Math.max(1, Math.round(viewportH * dpr));

    if (canvas.width !== backingW) canvas.width = backingW;
    if (canvas.height !== backingH) canvas.height = backingH;
    canvas.style.width = `${viewportW}px`;
    canvas.style.height = `${viewportH}px`;
    // overlay 跟随滚动停留在视口内（作为滚动容器的绝对定位子元素）
    canvas.style.left = `${container.scrollLeft}px`;
    canvas.style.top = `${container.scrollTop}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewportW, viewportH);

    const layout = stageLayoutRef.current;
    if (!gridEnabled || !sourceImageData || !layout) return;

    const transform: OverlayTransform = {
      offX: layout.canvasLeft - container.scrollLeft,
      offY: layout.canvasTop - container.scrollTop,
      zoom,
      viewportW,
      viewportH,
    };

    drawGridOverlay(
      ctx,
      transform,
      { width: sourceImageData.width, height: sourceImageData.height },
      gridScaleType,
      gridSeedCell,
      gridRegion,
      gridColumnCount,
      gridRowCount,
      marquee,
    );
  }, [
    containerRef,
    sourceImageData,
    gridScaleType,
    gridSeedCell,
    gridRegion,
    gridColumnCount,
    gridRowCount,
    marquee,
    zoom,
    stageLayout,
    viewportSize.width,
    viewportSize.height,
    gridEnabled,
  ]);

  const drawOverlayRef = useRef(drawOverlay);
  drawOverlayRef.current = drawOverlay;

  const redrawRafRef = useRef<number | null>(null);
  const scheduleRedraw = useCallback(() => {
    if (redrawRafRef.current !== null) return;
    redrawRafRef.current = requestAnimationFrame(() => {
      redrawRafRef.current = null;
      drawOverlayRef.current();
    });
  }, []);

  useLayoutEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  // 视口尺寸变化时同步 overlay backing store
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setViewportSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    setViewportSize({ width: container.clientWidth, height: container.clientHeight });
    return () => observer.disconnect();
  }, [containerRef]);

  // 滚动/平移时重绘并重新定位 overlay
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => scheduleRedraw();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (redrawRafRef.current !== null) {
        cancelAnimationFrame(redrawRafRef.current);
        redrawRafRef.current = null;
      }
    };
  }, [containerRef, scheduleRedraw]);

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
      if (isMiddleMousePressed(event.buttons)) {
        if (!isPanningRef.current) {
          startPanning(event.clientX, event.clientY);
        } else {
          applyPanMove(event.clientX, event.clientY);
        }
        return;
      }

      if (isPanningRef.current) {
        stopPanning();
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
        const point = clientToImage(event.clientX, event.clientY);
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

      const current = clientToImage(event.clientX, event.clientY);
      selection.current = current;
      setMarquee(
        clampCropRect(
          normalizeRect(selection.start, current),
          imageSize,
        ),
      );
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (isMiddleMouseButton(event.button)) {
        if (isPanningRef.current) {
          stopPanning();
        }
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

      const current = clientToImage(event.clientX, event.clientY);
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
    startPanning,
    commitGridSeedCell,
    commitGridRegion,
    setGridSeedCell,
    setGridRegion,
    clientToImage,
    isPanningRef,
  ]);

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMiddleMouseButton(event.button)) {
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
      const point = clientToImage(event.clientX, event.clientY);
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
    const start = clientToImage(event.clientX, event.clientY);
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

  const handleContainerMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isMiddleMouseButton(event.button)) {
      stopPanning();
    }
  };

  const footerHint =
    gridScaleType === "singleCell"
      ? "左键框选基准格 · 中键平移视图 · 拖拽角点 · 方向键微调 · Shift+方向键调右下角 · 右键取消 · Enter 应用"
      : "左键框选区域 · 中键平移视图 · 拖拽角点 · Shift+滚轮调 X · Ctrl+滚轮调 Y · 方向键移动 · Shift+方向键调大小 · 右键取消 · Enter 应用";

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
        onMouseUp={handleContainerMouseUp}
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
              </div>
            </div>
          )
        )}
        {sourceImageData && stageLayout && (
          <canvas
            ref={overlayCanvasRef}
            className={`absolute z-10 block touch-none select-none${
              isSelecting || isHandleDragging
                ? " cursor-crosshair"
                : isPanning
                  ? " cursor-grabbing"
                  : canDrawGrid
                    ? " cursor-crosshair"
                    : " cursor-grab"
            }`}
            draggable={false}
            onMouseDown={handleOverlayMouseDown}
            onAuxClick={handleAuxClick}
            onContextMenu={handleContextMenu}
          />
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
