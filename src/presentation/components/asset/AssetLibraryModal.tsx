import { useEffect } from "react";
import { useAppStore } from "../../stores/appStore";
import { AssetLibraryContent } from "./AssetLibraryContent";
import { AssetFolderDeleteDialog } from "./AssetFolderDeleteDialog";
import { AssetMoveConfirmDialog } from "./AssetMoveConfirmDialog";
import { ConfirmDialog } from "../ConfirmDialog";

export function AssetLibraryModal() {
  const open = useAppStore((s) => s.assetLibraryModalOpen);
  const softwareDataPath = useAppStore((s) => s.softwareDataPath);
  const library = useAppStore((s) => s.assetLibrary);
  const loading = useAppStore((s) => s.assetLibraryLoading);
  const selectedFolderId = useAppStore((s) => s.selectedAssetFolderId);
  const selectedAssetId = useAppStore((s) => s.selectedAssetId);
  const deleteAssetFolderTarget = useAppStore((s) => s.deleteAssetFolderTarget);
  const deleteAssetTarget = useAppStore((s) => s.deleteAssetTarget);
  const moveAssetTarget = useAppStore((s) => s.moveAssetTarget);

  const closeAssetLibraryModal = useAppStore((s) => s.closeAssetLibraryModal);
  const pickSoftwareDataPath = useAppStore((s) => s.pickSoftwareDataPath);
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
  const createMarkdownAssetAction = useAppStore((s) => s.createMarkdownAssetAction);
  const startAssetCanvasCapture = useAppStore((s) => s.startAssetCanvasCapture);
  const updateAssetRecordAction = useAppStore((s) => s.updateAssetRecordAction);
  const createAssetCategoryAction = useAppStore((s) => s.createAssetCategoryAction);
  const createAssetTagAction = useAppStore((s) => s.createAssetTagAction);

  useEffect(() => {
    if (open && softwareDataPath) {
      void refreshAssetLibrary();
    }
  }, [open, softwareDataPath, refreshAssetLibrary]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60">
      <div className="flex h-[85vh] w-[92vw] max-w-5xl flex-col overflow-hidden rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-4 py-3">
          <h2 className="text-sm font-medium text-zinc-200">资产管理</h2>
          <button
            type="button"
            onClick={closeAssetLibraryModal}
            className="text-zinc-400 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {!softwareDataPath ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
            <p className="text-sm text-zinc-400">
              请先选择软件数据路径，资产库将保存在该目录下的 .pixelart-assets 中。
            </p>
            <button
              type="button"
              onClick={() => void pickSoftwareDataPath()}
              className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              选择软件数据路径
            </button>
          </div>
        ) : loading || !library ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            加载中...
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden">
          <AssetLibraryContent
            library={library}
            workspacePath={softwareDataPath}
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
            onCreateMarkdownAsset={() => void createMarkdownAssetAction()}
            onUpdateAsset={(assetId, updates) =>
              void updateAssetRecordAction(assetId, updates)
            }
            onDeleteAsset={(assetId) => requestDeleteAssetRecord(assetId)}
            onRequestMoveAsset={requestMoveAssetRecord}
            onCreateCategory={(name) => void createAssetCategoryAction(name)}
            onCreateTag={(name) => void createAssetTagAction(name)}
          />
          </div>
        )}
      </div>
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
