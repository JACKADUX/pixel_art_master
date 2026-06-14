import { useCallback, useEffect, useRef, useState } from "react";

import type { ColorEntry } from "@/domain/palette/Palette";

import { buildReferenceColorPalette } from "@/domain/layer/ReferenceLayerPalette";

import type { ReferenceLayer } from "@/domain/layer/Layer";

import { gridColorRgbString } from "@/domain/appSettings/AppSettings";

import {
  renderReferenceLayer,
  renderReferenceLayerGrid,
} from "@/infrastructure/canvas/ReferenceLayerRenderer";

import { getReferenceImage } from "@/infrastructure/canvas/ReferenceImageCache";

import {
  blitWithDisplayMode,
  OklabDisplayGlRenderer,
} from "@/infrastructure/canvas/OklabDisplayGlRenderer";

import { ensureReferenceLayerPixelCache } from "@/infrastructure/canvas/ReferenceLayerPixelCache";

import { useAltKeyHeld } from "../hooks/useAltKeyHeld";

import { useAppStore, type ColorSlot } from "../stores/appStore";

import { ReferenceLayerColorStrip } from "./ReferenceLayerColorStrip";



interface ReferenceLayerOverlayProps {
  layer: ReferenceLayer;
  stackIndex: number;
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
  canvasLeft,
  canvasTop,
  zoom,
  isActive,
  onContextMenuRequest,
}: ReferenceLayerOverlayProps) {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const oklabRendererRef = useRef<OklabDisplayGlRenderer | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const moveReferenceLayer = useAppStore((s) => s.moveReferenceLayer);
  const canvasDisplayMode = useAppStore((s) => s.canvasDisplayMode);
  const appSettings = useAppStore((s) => s.appSettings);
  const activeTool = useAppStore((s) => s.activeTool);
  const pointerDown = useAppStore((s) => s.pointerDown);

  const pickColorAt = useAppStore((s) => s.pickColorAt);

  const setColorSlot = useAppStore((s) => s.setColorSlot);

  const foregroundColor = useAppStore((s) => s.foregroundColor);

  const backgroundColor = useAppStore((s) => s.backgroundColor);

  const altHeld = useAltKeyHeld();

  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(

    null,

  );

  const [isDragging, setIsDragging] = useState(false);

  const [paletteColors, setPaletteColors] = useState<ColorEntry[]>([]);



  const displayWidth = layer.crop ? layer.crop.width * zoom : 0;
  const displayHeight = layer.crop ? layer.crop.height * zoom : 0;
  const selectionToolActive = activeTool === "select";
  const imageAcceptsPointer = isActive || altHeld || selectionToolActive;

  useEffect(() => {
    oklabRendererRef.current = new OklabDisplayGlRenderer();
    glCanvasRef.current = document.createElement("canvas");
    return () => {
      oklabRendererRef.current?.dispose();
      oklabRendererRef.current = null;
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

      const renderer = oklabRendererRef.current;
      const glCanvas = glCanvasRef.current;

      if (canvasDisplayMode === "oklabLightness" && renderer && glCanvas) {
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
          renderReferenceLayerGrid(ctx, crop, zoom, layer.grid, gridAppearance);
          return;
        }
      }

      renderReferenceLayer(ctx, image, crop, zoom, layer.grid, gridAppearance);

    } catch {

      ctx.clearRect(0, 0, displayWidth, displayHeight);

    }

  }, [layer, zoom, displayWidth, displayHeight, canvasDisplayMode, gridAppearance]);



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

    if (e.button !== 0 && e.button !== 2) return;



    if (e.altKey) {

      e.preventDefault();

      e.stopPropagation();

      const canvas = canvasRef.current;

      if (!canvas || !layer.crop) return;

      const rect = canvas.getBoundingClientRect();

      const localX = Math.floor((e.clientX - rect.left) / zoom);

      const localY = Math.floor((e.clientY - rect.top) / zoom);

      pickColorAt(

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

          spaceKey: e.getModifierState("Space"),

        },

      );

      return;

    }



    if (!isActive || e.button !== 0) return;

    e.preventDefault();

    e.stopPropagation();

    dragStartRef.current = {

      x: e.clientX,

      y: e.clientY,

      posX: layer.position.x,

      posY: layer.position.y,

    };

    setIsDragging(true);

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



  if (!layer.visible || !layer.imageData || !layer.crop) {

    return null;

  }



  const left = canvasLeft + layer.position.x * zoom;

  const top = canvasTop + layer.position.y * zoom;



  return (

    <div

      className="absolute"

      style={{

        left,

        top,

        width: displayWidth,
        zIndex: 1 + stackIndex,
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
                  : ""
        }`}
        style={{
          imageRendering: "pixelated",
          height: displayHeight,
          pointerEvents: imageAcceptsPointer ? "auto" : "none",
        }}
        onMouseDown={imageAcceptsPointer ? handleMouseDown : undefined}
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

      {isActive && !altHeld && (

        <div

          className="pointer-events-none absolute inset-0 border-2 border-blue-500"

          style={{ height: displayHeight }}

          aria-hidden

        />

      )}

      <ReferenceLayerColorStrip

        colors={paletteColors}

        foregroundColor={foregroundColor}

        backgroundColor={backgroundColor}

        onSelect={setColorSlot}

      />

    </div>

  );

}


