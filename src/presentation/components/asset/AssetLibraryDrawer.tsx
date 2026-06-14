import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "../../stores/appStore";
import { AssetLibraryContent } from "./AssetLibraryContent";
import { AssetFolderDeleteDialog } from "./AssetFolderDeleteDialog";
import { AssetMoveConfirmDialog } from "./AssetMoveConfirmDialog";
import { ConfirmDialog } from "../ConfirmDialog";

const MIN_DRAWER_HEIGHT = 120;
const MAX_DRAWER_HEIGHT_RATIO = 0.7;

export function AssetLibraryDrawer() {
  const expanded = useAppStore((s) => s.assetLibraryDrawerExpanded);
  const drawerHeight = useAppStore((s) => s.assetLibraryDrawerHeight);
  const workspacePath = useAppStore((s) => s.projectsWorkspacePath);
  const library = useAppStore((s) => s.assetLibrary);
  const loading = useAppStore((s) => s.assetLibraryLoading);
  const selectedFolderId = useAppStore((s) => s.selectedAssetFolderId);
  const selectedAssetId = useAppStore((s) => s.selectedAssetId);
  const deleteAssetFolderTarget = useAppStore((s) => s.deleteAssetFolderTarget);
  const deleteAssetTarget = useAppStore((s) => s.deleteAssetTarget);
  const moveAssetTarget = useAppStore((s) => s.moveAssetTarget);

  const toggleAssetLibraryDrawer = useAppStore((s) => s.toggleAssetLibraryDrawer);
  const setAssetLibraryDrawerHeight = useAppStore((s) => s.setAssetLibraryDrawerHeight);
  const refreshAssetLibrary = useAppStore((s) => s.refreshAssetLibrary);
  const setSelectedAssetFolder = useAppStore((s) => s.setSelectedAssetFolder);
  const setSelectedAsset = useAppStore((s) => s.setSelectedAsset);
  const createAssetFolderAction = useAppStore((s) => s.createAssetFolderAction);
  const renameAssetFolderAction = useAppStore((s) => s.renameAssetFolderAction);
  const requestDeleteAssetFolder = useAppStore((s) => s.requestDeleteAssetFolder);
  const cancelDeleteAssetFolder = useAppStore((s) => s.cancelDeleteAssetFolder);
  const confirmDeleteAssetFolder = useAppStore((s) => s.confirmDeleteAssetFolder);
  const requestDeleteAssetRecord = useAppStore((s) => s.requestDeleteAssetRecord);
  const cancelDeleteAssetRecord = useAppStore((s) => s.cancelDeleteAssetRecord);
  const confirmDeleteAssetRecord = useAppStore((s) => s.confirmDeleteAssetRecord);
  const requestMoveAssetRecord = useAppStore((s) => s.requestMoveAssetRecord);
  const cancelMoveAssetRecord = useAppStore((s) => s.cancelMoveAssetRecord);
  const confirmMoveAssetRecord = useAppStore((s) => s.confirmMoveAssetRecord);
  const importAssetFromClipboardAction = useAppStore((s) => s.importAssetFromClipboardAction);
  const importAssetFromFileAction = useAppStore((s) => s.importAssetFromFileAction);
  const startAssetCanvasCapture = useAppStore((s) => s.startAssetCanvasCapture);
  const updateAssetRecordAction = useAppStore((s) => s.updateAssetRecordAction);
  const createAssetCategoryAction = useAppStore((s) => s.createAssetCategoryAction);
  const createAssetTagAction = useAppStore((s) => s.createAssetTagAction);
  const openAssetLibraryModal = useAppStore((s) => s.openAssetLibraryModal);

  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    if (expanded && workspacePath) {
      void refreshAssetLibrary();
    }
  }, [expanded, workspacePath, refreshAssetLibrary]);

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!expanded) return;
      e.preventDefault();
      dragRef.current = { startY: e.clientY, startHeight: drawerHeight };
      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        const delta = dragRef.current.startY - ev.clientY;
        const maxHeight = window.innerHeight * MAX_DRAWER_HEIGHT_RATIO;
        const next = Math.min(
          maxHeight,
          Math.max(MIN_DRAWER_HEIGHT, dragRef.current.startHeight + delta),
        );
        setAssetLibraryDrawerHeight(next);
      };
      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [expanded, drawerHeight, setAssetLibraryDrawerHeight],
  );

  const height = expanded ? drawerHeight : 32;

  return (
    <>
    <div
      className="flex shrink-0 flex-col border-t border-zinc-700 bg-zinc-900"
      style={{ height }}
    >
      {expanded && (
        <div
          className="flex h-2 shrink-0 cursor-row-resize items-center justify-center border-b border-zinc-800 hover:bg-zinc-800"
          onPointerDown={handleResizePointerDown}
        >
          <span className="text-[8px] text-zinc-600">⋯</span>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2 border-b border-zinc-700 px-3 py-1">
        <button
          type="button"
          onClick={toggleAssetLibraryDrawer}
          className="text-xs font-medium text-zinc-300 hover:text-zinc-100"
        >
          资产库 {expanded ? "▾" : "▴"}
        </button>
        <button
          type="button"
          onClick={openAssetLibraryModal}
          className="text-[10px] text-blue-400 hover:underline"
        >
          全屏
        </button>
        {!workspacePath && (
          <span className="text-[10px] text-zinc-500">未设置项目目录</span>
        )}
      </div>

      {expanded && workspacePath && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {loading || !library ? (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
              加载中...
            </div>
          ) : (
            <AssetLibraryContent
              library={library}
              workspacePath={workspacePath}
              selectedFolderId={selectedFolderId}
              selectedAssetId={selectedAssetId}
              onSelectFolder={setSelectedAssetFolder}
              onSelectAsset={setSelectedAsset}
              onCreateFolder={(parentId) => void createAssetFolderAction(parentId)}
              onRenameFolder={(folderId, name) =>
                void renameAssetFolderAction(folderId, name)
              }
              onRequestDeleteFolder={requestDeleteAssetFolder}
              onImportClipboard={() => void importAssetFromClipboardAction()}
              onImportFile={() => void importAssetFromFileAction()}
              onStartCanvasCapture={() => startAssetCanvasCapture()}
              onUpdateAsset={(assetId, updates) =>
                void updateAssetRecordAction(assetId, updates)
              }
              onDeleteAsset={(assetId) => requestDeleteAssetRecord(assetId)}
              onRequestMoveAsset={requestMoveAssetRecord}
              onCreateCategory={(name) => void createAssetCategoryAction(name)}
              onCreateTag={(name) => void createAssetTagAction(name)}
            />
          )}
        </div>
      )}
    </div>
    <AssetFolderDeleteDialog
      open={deleteAssetFolderTarget !== null}
      folderName={deleteAssetFolderTarget?.folderName ?? ""}
      assetCount={deleteAssetFolderTarget?.assetCount ?? 0}
      childFolderCount={deleteAssetFolderTarget?.childFolderCount ?? 0}
      onConfirm={(disposition) => void confirmDeleteAssetFolder(disposition)}
      onCancel={cancelDeleteAssetFolder}
    />
    <ConfirmDialog
      open={deleteAssetTarget !== null}
      title="删除资产"
      message={`确定删除资产「${deleteAssetTarget?.title ?? ""}」吗？此操作不可恢复。`}
      confirmLabel="删除"
      danger
      onConfirm={() => void confirmDeleteAssetRecord()}
      onCancel={cancelDeleteAssetRecord}
    />
    <AssetMoveConfirmDialog
      open={moveAssetTarget !== null}
      assetTitle={moveAssetTarget?.title ?? ""}
      fromFolderLabel={moveAssetTarget?.fromFolderLabel ?? ""}
      toFolderLabel={moveAssetTarget?.toFolderLabel ?? ""}
      onConfirm={() => void confirmMoveAssetRecord()}
      onCancel={cancelMoveAssetRecord}
    />
    </>
  );
}
