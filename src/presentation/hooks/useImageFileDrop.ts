import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useCallback, useEffect, useRef, useState } from "react";
import { hasSupportedImagePath } from "../components/pluginPage/imageFileDrop";
import { pickSupportedImagePath } from "@/domain/image/SupportedImageFormat";
import {
  isImageFileDrag,
  pickDroppedImageFile,
  tauriDragPositionToClient,
  type DropPointerPosition,
} from "../components/pluginPage/imageFileDrop";

export type { DropPointerPosition };

interface UseImageFileDropOptions {
  enabled?: boolean;
  disabled?: boolean;
  onImportPath: (path: string, position?: DropPointerPosition) => void | Promise<void>;
  onImportFile: (file: File, position?: DropPointerPosition) => void | Promise<void>;
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
  const ctrlKeyRef = useRef(false);
  const onImportPathRef = useRef(onImportPath);
  const onImportFileRef = useRef(onImportFile);

  disabledRef.current = disabled;
  onImportPathRef.current = onImportPath;
  onImportFileRef.current = onImportFile;

  useEffect(() => {
    const syncCtrl = (event: KeyboardEvent) => {
      ctrlKeyRef.current = event.ctrlKey;
    };
    window.addEventListener("keydown", syncCtrl);
    window.addEventListener("keyup", syncCtrl);
    return () => {
      window.removeEventListener("keydown", syncCtrl);
      window.removeEventListener("keyup", syncCtrl);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsDraggingOver(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isTauri()) return;

    let unlisten: (() => void) | undefined;
    let cancelled = false;

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
            const position = tauriDragPositionToClient(payload.position);
            void onImportPathRef.current(path, { ...position, ctrlKey: ctrlKeyRef.current });
          }
        }
      })
      .then((fn) => {
        if (cancelled) {
          fn();
          return;
        }
        unlisten = fn;
      });

    return () => {
      cancelled = true;
      unlisten?.();
      setIsDraggingOver(false);
    };
  }, [enabled]);

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
        void onImportFileRef.current(file, {
          clientX: event.clientX,
          clientY: event.clientY,
          ctrlKey: event.ctrlKey,
        });
      }
    },
    [enabled, disabled],
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
