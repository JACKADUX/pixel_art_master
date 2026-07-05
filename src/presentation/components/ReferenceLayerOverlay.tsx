import { useCallback, useEffect, useRef, useState } from "react";

import {
  ArrowsPointingInIcon,
  Squares2X2Icon,
  SwatchIcon,
} from "@heroicons/react/24/outline";

import type { ColorEntry } from "@/domain/palette/Palette";

import { buildReferenceColorPalette } from "@/domain/layer/ReferenceLayerPalette";

import { clampReferenceScale } from "@/domain/layer/ReferenceLayerOperations";

import type { LayerPosition, ReferenceLayer } from "@/domain/layer/Layer";
import {
  computeReferenceLayerCanvasZIndex,
  computeReferenceLayerChromeZIndex,
} from "@/domain/layer/LayerStack";

import { gridColorRgbString } from "@/domain/appSettings/AppSettings";

import {
  renderReferenceLayer,
  renderReferenceLayerGrid,
} from "@/infrastructure/canvas/ReferenceLayerRenderer";

import { getReferenceImage } from "@/infrastructure/canvas/ReferenceImageCache";

import {
  blitWithDisplayMode,
  OklchDisplayGlRenderer,
} from "@/infrastructure/canvas/OklchDisplayGlRenderer";

import { ensureReferenceLayerPixelCache } from "@/infrastructure/canvas/ReferenceLayerPixelCache";

import { useAltKeyHeld } from "../hooks/useAltKeyHeld";
import { useSpaceKeyHeldRef } from "../hooks/useSpaceKeyHeld";

import { useAppStore, type ColorSlot } from "../stores/appStore";

import { focusCanvasKeyboard } from "../utils/canvasKeyboardFocus";

import { ReferenceLayerColorStrip } from "./ReferenceLayerColorStrip";



interface ReferenceLayerOverlayProps {
  layer: ReferenceLayer;
  stackIndex: number;
  referenceLayerCount: number;
  canvasLeft: number;
  canvasTop: number;
  zoom: number;
  isActive: boolean;
  onContextMenuRequest?: (layerId: string, clientX: number, clientY: number) => void;
}



function colorSlotFromMouseButton(button: number): ColorSlot {
  return button === 2 ? "background" : "foreground";
}

export function ReferenceLayerOverlay({
  layer,
  stackIndex,
  referenceLayerCount,
  canvasLeft,
  canvasTop,
  zoom,
  isActive,
  onContextMenuRequest,
}: ReferenceLayerOverlayProps) {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const oklchRendererRef = useRef<OklchDisplayGlRenderer | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const moveReferenceLayer = useAppStore((s) => s.moveReferenceLayer);
  const resizeReferenceLayer = useAppStore((s) => s.resizeReferenceLayer);
  const resetReferenceScale = useAppStore((s) => s.resetReferenceScale);
  const toggleReferenceGrid = useAppStore((s) => s.toggleReferenceGrid);
  const toggleReferencePalette = useAppStore((s) => s.toggleReferencePalette);
  const setActiveReferenceLayer = useAppStore((s) => s.setActiveReferenceLayer);
  const openCropEditor = useAppStore((s) => s.openCropEditor);
  const paletteHidden = !layer.paletteVisible;
  const canvasDisplayMode = useAppStore((s) => s.canvasDisplayMode);
  const appSettings = useAppStore((s) => s.appSettings);
  const activeTool = useAppStore((s) => s.activeTool);
  const pointerDown = useAppStore((s) => s.pointerDown);

  const pickColorAt = useAppStore((s) => s.pickColorAt);

  const setColorSlot = useAppStore((s) => s.setColorSlot);

  const foregroundColor = useAppStore((s) => s.foregroundColor);

  const backgroundColor = useAppStore((s) => s.backgroundColor);

  const altHeld = useAltKeyHeld();
  const spaceKeyHeldRef = useSpaceKeyHeldRef();

  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(

    null,

  );

  const [isDragging, setIsDragging] = useState(false);

  const [paletteColors, setPaletteColors] = useState<ColorEntry[]>([]);

  const resizeStartRef = useRef<{
    anchorGridX: number;
    anchorGridY: number;
    anchorClientX: number;
    anchorClientY: number;
    signX: number;
    signY: number;
  } | null>(null);

  const [isResizing, setIsResizing] = useState(false);

  const [isHovered, setIsHovered] = useState(false);

  const hoverHideTimeoutRef = useRef<number | null>(null);

  const handleHoverEnter = useCallback(() => {
    if (hoverHideTimeoutRef.current !== null) {
      window.clearTimeout(hoverHideTimeoutRef.current);
      hoverHideTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleHoverLeave = useCallback(() => {
    if (hoverHideTimeoutRef.current !== null) {
      window.clearTimeout(hoverHideTimeoutRef.current);
    }
    hoverHideTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
      hoverHideTimeoutRef.current = null;
    }, 120);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverHideTimeoutRef.current !== null) {
        window.clearTimeout(hoverHideTimeoutRef.current);
      }
    };
  }, []);

  const scale = clampReferenceScale(layer.scale);
  const effectiveZoom = zoom * scale;

  const displayWidth = layer.crop ? layer.crop.width * effectiveZoom : 0;
  const displayHeight = layer.crop ? layer.crop.height * effectiveZoom : 0;
  const selectionToolActive = activeTool === "select";
  const transformToolActive = activeTool === "transform";
  const showTransformBox = isActive && !altHeld && transformToolActive;
  const imageAcceptsPointer = true;

  useEffect(() => {
    oklchRendererRef.current = new OklchDisplayGlRenderer();
    glCanvasRef.current = document.createElement("canvas");
    return () => {
      oklchRendererRef.current?.dispose();
      oklchRendererRef.current = null;
      glCanvasRef.current = null;
    };
  }, []);

  const gridAppearance = {
    colorRgb: gridColorRgbString(appSettings.gridColorHex),
    lineWidth: appSettings.gridLineWidth,
    subGridEnabled: appSettings.subGridEnabled,
  };

  const render = useCallback(async () => {

    const canvas = canvasRef.current;

    if (!canvas || !layer.visible || !layer.imageData || !layer.crop) return;



    canvas.width = displayWidth;

    canvas.height = displayHeight;

    canvas.style.width = `${displayWidth}px`;

    canvas.style.height = `${displayHeight}px`;



    const ctx = canvas.getContext("2d");

    if (!ctx) return;



    try {

      const image = await getReferenceImage(layer.id, layer.imageData);
      const crop = layer.crop;

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const renderer = oklchRendererRef.current;
      const glCanvas = glCanvasRef.current;

      if (canvasDisplayMode === "oklchLightness" && renderer && glCanvas) {
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = crop.width;
        cropCanvas.height = crop.height;
        const cropCtx = cropCanvas.getContext("2d");
        if (cropCtx) {
          cropCtx.imageSmoothingEnabled = false;
          cropCtx.drawImage(
            image,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height,
          );
          blitWithDisplayMode(
            renderer,
            glCanvas,
            cropCanvas,
            displayWidth,
            displayHeight,
            canvasDisplayMode,
          );
          ctx.drawImage(glCanvas, 0, 0, displayWidth, displayHeight);
          renderReferenceLayerGrid(ctx, crop, effectiveZoom, layer.grid, gridAppearance);
          return;
        }
      }

      renderReferenceLayer(ctx, image, crop, effectiveZoom, layer.grid, gridAppearance);

    } catch {

      ctx.clearRect(0, 0, displayWidth, displayHeight);

    }

  }, [layer, effectiveZoom, displayWidth, displayHeight, canvasDisplayMode, gridAppearance]);



  useEffect(() => {

    void render();

  }, [render]);



  useEffect(() => {

    if (!layer.visible || !layer.imageData || !layer.crop) {

      setPaletteColors([]);

      return;

    }



    let cancelled = false;

    void ensureReferenceLayerPixelCache(layer).then((cache) => {

      if (cancelled || !cache) return;

      setPaletteColors(buildReferenceColorPalette(cache.pixels));

    });



    return () => {

      cancelled = true;

    };

  }, [layer.id, layer.visible, layer.imageData, layer.crop]);



  const handleMouseDown = (e: React.MouseEvent) => {
    focusCanvasKeyboard();

    if (e.button !== 0 && e.button !== 2) return;

    if (e.altKey) {
      e.preventDefault();
      e.stopPropagation();

      const canvas = canvasRef.current;
      if (!canvas || !layer.crop) return;

      const rect = canvas.getBoundingClientRect();
      const localX = Math.floor((e.clientX - rect.left) / zoom);
      const localY = Math.floor((e.clientY - rect.top) / zoom);

      void pickColorAt(
        {
          x: layer.position.x + localX,
          y: layer.position.y + localY,
        },
        colorSlotFromMouseButton(e.button),
      );
      return;
    }

    if (selectionToolActive && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();

      if (!isActive) {
        setActiveReferenceLayer(layer.id);
      }

      const canvas = canvasRef.current;
      if (!canvas || !layer.crop) return;

      const rect = canvas.getBoundingClientRect();
      const localX = Math.floor((e.clientX - rect.left) / zoom);
      const localY = Math.floor((e.clientY - rect.top) / zoom);

      pointerDown(
        {
          x: layer.position.x + localX,
          y: layer.position.y + localY,
        },
        "primary",
        {
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          spaceKey: spaceKeyHeldRef.current,
        },
      );
      return;
    }

    if (e.button === 0) {
      e.preventDefault();
      e.stopPropagation();

      if (!isActive) {
        setActiveReferenceLayer(layer.id);
      }

      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: layer.position.x,
        posY: layer.position.y,
      };
      setIsDragging(true);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (layer.imageData) {
      openCropEditor(layer.id);
    }
  };



  useEffect(() => {

    if (!isDragging) return;



    const handleMouseMove = (e: MouseEvent) => {

      const start = dragStartRef.current;

      if (!start) return;

      const deltaX = Math.round((e.clientX - start.x) / zoom);

      const deltaY = Math.round((e.clientY - start.y) / zoom);

      moveReferenceLayer(layer.id, {

        x: start.posX + deltaX,

        y: start.posY + deltaY,

      });

    };



    const handleMouseUp = () => {

      dragStartRef.current = null;

      setIsDragging(false);

    };



    document.addEventListener("mousemove", handleMouseMove);

    document.addEventListener("mouseup", handleMouseUp);

    return () => {

      document.removeEventListener("mousemove", handleMouseMove);

      document.removeEventListener("mouseup", handleMouseUp);

    };

  }, [isDragging, layer.id, moveReferenceLayer, zoom]);



  const handleResizeStart = (
    e: React.MouseEvent,
    signX: number,
    signY: number,
  ) => {
    if (e.button !== 0 || !layer.crop || !showTransformBox) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    e.stopPropagation();
    focusCanvasKeyboard();

    const rect = canvas.getBoundingClientRect();
    const px = layer.position.x;
    const py = layer.position.y;
    const w = layer.crop.width * scale;
    const h = layer.crop.height * scale;

    resizeStartRef.current = {
      // Fixed (anchor) corner in canvas-grid coordinates, used to reposition.
      anchorGridX: signX > 0 ? px : px + w,
      anchorGridY: signY > 0 ? py : py + h,
      // Same anchor corner in viewport/client coordinates, used to size.
      anchorClientX: signX > 0 ? rect.left : rect.right,
      anchorClientY: signY > 0 ? rect.top : rect.bottom,
      signX,
      signY,
    };
    setIsResizing(true);
  };



  useEffect(() => {

    if (!isResizing) return;

    const crop = layer.crop;
    if (!crop) return;

    const handleMouseMove = (e: MouseEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;

      const scaleFromW = Math.abs(e.clientX - start.anchorClientX) / (crop.width * zoom);
      const scaleFromH = Math.abs(e.clientY - start.anchorClientY) / (crop.height * zoom);
      const nextScale = clampReferenceScale(Math.max(scaleFromW, scaleFromH));

      const newW = crop.width * nextScale;
      const newH = crop.height * nextScale;

      const position: LayerPosition = {
        x: Math.round(start.signX > 0 ? start.anchorGridX : start.anchorGridX - newW),
        y: Math.round(start.signY > 0 ? start.anchorGridY : start.anchorGridY - newH),
      };

      resizeReferenceLayer(layer.id, { scale: nextScale, position });
    };

    const handleMouseUp = () => {
      resizeStartRef.current = null;
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

  }, [isResizing, layer.id, layer.crop, resizeReferenceLayer, zoom]);



  if (!layer.visible || !layer.imageData || !layer.crop) {

    return null;

  }



  const left = canvasLeft + layer.position.x * zoom;

  const top = canvasTop + layer.position.y * zoom;

  const overlayPosition = { left, top, width: displayWidth };

  const canvasZIndex = computeReferenceLayerCanvasZIndex(stackIndex);
  const chromeZIndex = computeReferenceLayerChromeZIndex(
    stackIndex,
    isActive,
    referenceLayerCount,
  );



  return (

    <>

      <div

        className="absolute"

        style={{

          ...overlayPosition,

          zIndex: canvasZIndex,

          pointerEvents: "none",

        }}

      >

        <canvas
          ref={canvasRef}
          className={`block${
            isDragging
              ? " cursor-grabbing"
              : altHeld
                ? " cursor-eyedropper"
                : selectionToolActive
                  ? " cursor-crosshair"
                  : isActive
                    ? " cursor-move"
                    : " cursor-pointer"
          }`}
          style={{
            imageRendering: "pixelated",
            height: displayHeight,
            pointerEvents: imageAcceptsPointer ? "auto" : "none",
          }}
          onMouseDown={imageAcceptsPointer ? handleMouseDown : undefined}
          onDoubleClick={imageAcceptsPointer ? handleDoubleClick : undefined}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
          onContextMenu={(e) => {
            if (altHeld) {
              e.preventDefault();
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            onContextMenuRequest?.(layer.id, e.clientX, e.clientY);
          }}
        />

        {showTransformBox && (

          <div

            className="pointer-events-none absolute inset-0 border-2 border-blue-500"

            style={{ height: displayHeight }}

            aria-hidden

          />

        )}

      </div>

      <div

        className="absolute"

        style={{

          ...overlayPosition,

          zIndex: chromeZIndex,

          pointerEvents: "none",

        }}

      >

        {isActive && !altHeld && isHovered && (
          <div
            className="pointer-events-auto absolute left-0 flex items-center gap-0.5 rounded border border-zinc-700/80 bg-zinc-900/90 p-0.5 shadow"
            style={{ top: -4, transform: "translateY(-100%)" }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseEnter={handleHoverEnter}
            onMouseLeave={handleHoverLeave}
          >
          <button
            type="button"
            title={layer.grid.visible ? "关闭网格" : "启用网格"}
            onClick={() => toggleReferenceGrid(layer.id)}
            className={`flex h-6 w-6 items-center justify-center rounded transition hover:bg-zinc-700 ${
              layer.grid.visible
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-200"
            }`}
          >
            <Squares2X2Icon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title={paletteHidden ? "显示参考图色板" : "关闭参考图色板"}
            onClick={() => toggleReferencePalette(layer.id)}
            className={`flex h-6 w-6 items-center justify-center rounded transition hover:bg-zinc-700 ${
              paletteHidden
                ? "bg-zinc-800 text-zinc-200"
                : "bg-blue-600 text-white"
            }`}
          >
            <SwatchIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title={
              scale !== 1
                ? `还原大小 (当前 ${Math.round(scale * 100)}%)`
                : "还原大小"
            }
            disabled={scale === 1}
            onClick={() => resetReferenceScale(layer.id)}
            className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-zinc-800"
          >
            <ArrowsPointingInIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {showTransformBox &&
        (
          [
            { key: "tl", signX: -1, signY: -1, top: 0, left: 0, cursor: "nwse-resize" },
            { key: "tr", signX: 1, signY: -1, top: 0, left: displayWidth, cursor: "nesw-resize" },
            { key: "bl", signX: -1, signY: 1, top: displayHeight, left: 0, cursor: "nesw-resize" },
            { key: "br", signX: 1, signY: 1, top: displayHeight, left: displayWidth, cursor: "nwse-resize" },
          ] as const
        ).map((handle) => (
          <div
            key={handle.key}
            className="pointer-events-auto absolute h-2.5 w-2.5 rounded-sm border border-white bg-blue-500"
            style={{
              top: handle.top,
              left: handle.left,
              transform: "translate(-50%, -50%)",
              cursor: handle.cursor,
            }}
            onMouseDown={(e) => handleResizeStart(e, handle.signX, handle.signY)}
            aria-label="缩放参考图"
          />
        ))}

      <div
        aria-hidden
        className="pointer-events-none"
        style={{ height: displayHeight }}
      />

      {!paletteHidden && (
        <ReferenceLayerColorStrip

          colors={paletteColors}

          foregroundColor={foregroundColor}

          backgroundColor={backgroundColor}

          onSelect={setColorSlot}

        />
      )}

      </div>

    </>

  );

}


