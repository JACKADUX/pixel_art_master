import { useCallback, useRef, useState } from "react";
import {
  hasDragMovement,
  resolveFolderIdAtPoint,
} from "@/presentation/components/asset/assetPointerDrag";

interface PendingDrag {
  assetId: string;
  startX: number;
  startY: number;
  pointerId: number;
  active: boolean;
}

export function useAssetPointerDrag(
  onRequestMoveAsset: (assetId: string, targetFolderId: string) => void,
) {
  const [draggingAssetId, setDraggingAssetId] = useState<string | null>(null);
  const [hoverFolderId, setHoverFolderId] = useState<string | null>(null);

  const pendingRef = useRef<PendingDrag | null>(null);
  const hoverFolderIdRef = useRef<string | null>(null);
  const suppressClickRef = useRef(false);

  const stopDrag = useCallback(() => {
    pendingRef.current = null;
    hoverFolderIdRef.current = null;
    setDraggingAssetId(null);
    setHoverFolderId(null);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  const beginAssetPointerDrag = useCallback(
    (e: React.PointerEvent, assetId: string) => {
      if (e.button !== 0) return;

      pendingRef.current = {
        assetId,
        startX: e.clientX,
        startY: e.clientY,
        pointerId: e.pointerId,
        active: false,
      };

      const onPointerMove = (ev: PointerEvent) => {
        const pending = pendingRef.current;
        if (!pending || ev.pointerId !== pending.pointerId) return;

        const dx = ev.clientX - pending.startX;
        const dy = ev.clientY - pending.startY;

        if (!pending.active) {
          if (!hasDragMovement(dx, dy)) return;
          pending.active = true;
          setDraggingAssetId(pending.assetId);
          document.body.style.userSelect = "none";
          document.body.style.cursor = "grabbing";
        }

        const folderId = resolveFolderIdAtPoint(ev.clientX, ev.clientY);
        hoverFolderIdRef.current = folderId;
        setHoverFolderId(folderId);
      };

      const onPointerUp = (ev: PointerEvent) => {
        const pending = pendingRef.current;
        if (!pending || ev.pointerId !== pending.pointerId) return;

        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);

        if (pending.active) {
          suppressClickRef.current = true;
          const folderId = hoverFolderIdRef.current;
          if (folderId) {
            onRequestMoveAsset(pending.assetId, folderId);
          }
        }

        stopDrag();
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    },
    [onRequestMoveAsset, stopDrag],
  );

  const consumeSuppressClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    draggingAssetId,
    hoverFolderId,
    beginAssetPointerDrag,
    consumeSuppressClick,
  };
}
