import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useCallback, useEffect, useRef, useState } from "react";
import { hasSupportedImagePath } from "../components/toolPage/imageFileDrop";
import { pickSupportedImagePath } from "@/domain/image/SupportedImageFormat";
import { isImageFileDrag, pickDroppedImageFile } from "../components/toolPage/imageFileDrop";

interface UseImageFileDropOptions {
  enabled?: boolean;
  disabled?: boolean;
  onImportPath: (path: string) => void | Promise<void>;
  onImportFile: (file: File) => void | Promise<void>;
}

export function useImageFileDrop({
  enabled = true,
  disabled = false,
  onImportPath,
  onImportFile,
}: UseImageFileDropOptions) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragDepthRef = useRef(0);
  const disabledRef = useRef(disabled);

  disabledRef.current = disabled;

  useEffect(() => {
    if (!enabled) {
      setIsDraggingOver(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isTauri()) return;

    let unlisten: (() => void) | undefined;

    void getCurrentWebview()
      .onDragDropEvent((event) => {
        if (disabledRef.current) return;

        const payload = event.payload;
        if (payload.type === "enter") {
          if (hasSupportedImagePath(payload.paths)) {
            setIsDraggingOver(true);
          }
          return;
        }

        if (payload.type === "over") {
          setIsDraggingOver(true);
          return;
        }

        if (payload.type === "leave") {
          setIsDraggingOver(false);
          return;
        }

        if (payload.type === "drop") {
          setIsDraggingOver(false);
          const path = pickSupportedImagePath(payload.paths);
          if (path) {
            void onImportPath(path);
          }
        }
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
      setIsDraggingOver(false);
    };
  }, [enabled, onImportPath]);

  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      if (!enabled || disabled || isTauri() || !isImageFileDrag(event.dataTransfer)) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsDraggingOver(true);
    },
    [enabled, disabled],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      if (!enabled || disabled || isTauri() || !isImageFileDrag(event.dataTransfer)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    [enabled, disabled],
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent) => {
      if (!enabled || disabled || isTauri()) return;
      event.preventDefault();
      dragDepthRef.current -= 1;
      if (dragDepthRef.current <= 0) {
        dragDepthRef.current = 0;
        setIsDraggingOver(false);
      }
    },
    [enabled, disabled],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      if (!enabled || disabled || isTauri()) return;
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingOver(false);

      const file = pickDroppedImageFile(event.dataTransfer);
      if (file) {
        void onImportFile(file);
      }
    },
    [enabled, disabled, onImportFile],
  );

  return {
    isDraggingOver: enabled && isDraggingOver,
    dropZoneProps: isTauri()
      ? {}
      : {
          onDragEnter: handleDragEnter,
          onDragOver: handleDragOver,
          onDragLeave: handleDragLeave,
          onDrop: handleDrop,
        },
  };
}
