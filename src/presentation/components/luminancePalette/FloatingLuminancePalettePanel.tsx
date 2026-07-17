import { useCallback, useEffect, useRef, useState } from "react";

import { fromHex } from "@/domain/canvas/PixelColor";

import { computeFloatingPanelZIndex } from "@/domain/viewport/FloatingPanelStack";

import { useAppStore } from "@/presentation/stores/appStore";

import { ConfirmDialog } from "../ConfirmDialog";

import { LuminancePaletteBoard } from "./LuminancePaletteBoard";

import { LuminancePaletteMoreMenu } from "./LuminancePaletteMoreMenu";



interface RemoveGroupTarget {

  groupId: string;

  groupName: string;

  colorCount: number;

}



const TITLE_VISIBLE_GROUP_THRESHOLD = 5;



export function FloatingLuminancePalettePanel() {

  const panelRef = useRef<HTMLDivElement>(null);

  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const isDraggingRef = useRef(false);

  const [removeTarget, setRemoveTarget] = useState<RemoveGroupTarget | null>(null);



  const project = useAppStore((s) => s.project);

  const panel = useAppStore((s) => s.luminancePalettePanel);

  const foregroundColor = useAppStore((s) => s.foregroundColor);

  const backgroundColor = useAppStore((s) => s.backgroundColor);

  const setColorSlot = useAppStore((s) => s.setColorSlot);

  const setLuminancePalettePanelPositionWithAnchor = useAppStore(

    (s) => s.setLuminancePalettePanelPositionWithAnchor,

  );

  const setLuminancePalettePanelSize = useAppStore((s) => s.setLuminancePalettePanelSize);

  const finalizeLuminancePalettePanelDrag = useAppStore(

    (s) => s.finalizeLuminancePalettePanelDrag,

  );

  const floatingPanelStack = useAppStore((s) => s.floatingPanelStack);

  const bringFloatingPanelToFront = useAppStore((s) => s.bringFloatingPanelToFront);

  const removeLuminancePaletteGroupAction = useAppStore(

    (s) => s.removeLuminancePaletteGroupAction,

  );

  const setLuminancePaletteActiveGroup = useAppStore((s) => s.setLuminancePaletteActiveGroup);

  const setLuminanceSwatchForeground = useAppStore((s) => s.setLuminanceSwatchForeground);

  const removeLuminanceSwatch = useAppStore((s) => s.removeLuminanceSwatch);

  const importColorsToLuminanceGroupAction = useAppStore(

    (s) => s.importColorsToLuminanceGroupAction,

  );

  const closeLuminancePalettePanel = useAppStore((s) => s.closeLuminancePalettePanel);

  const toggleLuminancePaletteEditMode = useAppStore((s) => s.toggleLuminancePaletteEditMode);

  const moveLuminancePaletteGroupAction = useAppStore((s) => s.moveLuminancePaletteGroupAction);

  const activateLuminanceSwatchLiveEdit = useAppStore((s) => s.activateLuminanceSwatchLiveEdit);

  const deactivateLuminanceSwatchLiveEdit = useAppStore(

    (s) => s.deactivateLuminanceSwatchLiveEdit,

  );



  const syncPanelSize = useCallback(() => {

    const el = panelRef.current;

    if (!el) return;

    setLuminancePalettePanelSize(el.offsetWidth, el.offsetHeight);

  }, [setLuminancePalettePanelSize]);



  useEffect(() => {

    const el = panelRef.current;

    if (!el || !panel.visible) return;



    syncPanelSize();

    const observer = new ResizeObserver(syncPanelSize);

    observer.observe(el);

    return () => observer.disconnect();

  }, [panel.visible, syncPanelSize, project?.luminancePalette.groups.length]);



  useEffect(() => {

    const handleMouseMove = (e: MouseEvent) => {

      if (!isDraggingRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;

      const dy = e.clientY - dragStartRef.current.y;

      setLuminancePalettePanelPositionWithAnchor(

        dragStartRef.current.posX + dx,

        dragStartRef.current.posY + dy,

      );

    };



    const handleMouseUp = () => {

      if (isDraggingRef.current) {

        finalizeLuminancePalettePanelDrag();

      }

      isDraggingRef.current = false;

    };



    window.addEventListener("mousemove", handleMouseMove);

    window.addEventListener("mouseup", handleMouseUp);

    return () => {

      window.removeEventListener("mousemove", handleMouseMove);

      window.removeEventListener("mouseup", handleMouseUp);

    };

  }, [setLuminancePalettePanelPositionWithAnchor, finalizeLuminancePalettePanelDrag]);



  useEffect(() => {

    if (panel.visible) bringFloatingPanelToFront("luminancePalette");

  }, [panel.visible, bringFloatingPanelToFront]);



  if (!panel.visible || !project) return null;



  const palette = project.luminancePalette;

  const showTitle = palette.groups.length >= TITLE_VISIBLE_GROUP_THRESHOLD;



  const handleHeaderMouseDown = (e: React.MouseEvent) => {

    if (e.button !== 0) return;

    e.preventDefault();

    e.stopPropagation();

    isDraggingRef.current = true;

    dragStartRef.current = {

      x: e.clientX,

      y: e.clientY,

      posX: panel.position.x,

      posY: panel.position.y,

    };

  };



  const handleRequestRemoveGroup = (groupId: string, groupName: string) => {

    const group = palette.groups.find((item) => item.id === groupId);

    if (!group) return;

    setRemoveTarget({

      groupId,

      groupName,

      colorCount: group.colors.length,

    });

  };



  const handleConfirmRemoveGroup = () => {

    if (!removeTarget) return;

    removeLuminancePaletteGroupAction(removeTarget.groupId);

    setRemoveTarget(null);

  };



  return (

    <>

      <div

        ref={panelRef}

        role="dialog"

        aria-label="明度色板"

        className="pointer-events-auto absolute w-fit overflow-visible rounded-lg border-2 border-zinc-600 bg-zinc-900 shadow-xl"

        style={{

          left: panel.position.x,

          top: panel.position.y,

          zIndex: computeFloatingPanelZIndex(floatingPanelStack, "luminancePalette"),

        }}

        onMouseDown={(e) => {

          e.stopPropagation();

          bringFloatingPanelToFront("luminancePalette");

        }}

      >

        <div

          className="flex shrink-0 cursor-move items-center justify-between gap-2 border-b border-zinc-700 bg-zinc-800/80 px-2 py-1.5"

          onMouseDown={handleHeaderMouseDown}

        >

          <span className="flex h-5 w-5 shrink-0 items-center justify-center p-0.5" aria-hidden />

          {showTitle ? (

            <span className="flex-1 text-center text-xs font-medium text-zinc-200">明度色板</span>

          ) : (

            <span className="flex-1" aria-hidden />

          )}

          <LuminancePaletteMoreMenu
            editMode={panel.editMode}
            onToggleEditMode={toggleLuminancePaletteEditMode}
            onClosePanel={closeLuminancePalettePanel}
          />

        </div>



        <div className="p-1">

          <LuminancePaletteBoard

            palette={palette}

            editMode={panel.editMode}

            liveEditTarget={panel.liveEditTarget}

            foregroundColor={foregroundColor}

            backgroundColor={backgroundColor}

            onSelect={setColorSlot}

            onActivateGroup={setLuminancePaletteActiveGroup}

            onSetSwatchForeground={setLuminanceSwatchForeground}

            onRemoveSwatch={removeLuminanceSwatch}

            onMoveGroup={moveLuminancePaletteGroupAction}

            onRequestRemoveGroup={handleRequestRemoveGroup}

            onActivateLiveEdit={activateLuminanceSwatchLiveEdit}

            onDeactivateLiveEdit={deactivateLuminanceSwatchLiveEdit}

            onImportDroppedColors={(groupId, hexes) => {

              const entries = hexes.map((hex) => ({ hex, color: fromHex(hex) }));

              importColorsToLuminanceGroupAction(groupId, entries);

            }}

          />

        </div>

      </div>



      <ConfirmDialog

        open={removeTarget !== null}

        title="移除颜色组"

        message={

          removeTarget

            ? `确定移除「${removeTarget.groupName}」？组内 ${removeTarget.colorCount} 色将一并删除。`

            : ""

        }

        confirmLabel="移除"

        danger

        onConfirm={handleConfirmRemoveGroup}

        onCancel={() => setRemoveTarget(null)}

      />

    </>

  );

}

