import { useMemo, useState } from "react";
import { findAssetById, type AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import { ContextMenu } from "../ContextMenu";
import { buildAssetContextMenuItems } from "../../config/assetContextMenu";
import { useAppStore } from "../../stores/appStore";
import { AssetDetailPanel } from "./AssetDetailPanel";
import { AssetFolderTree } from "./AssetFolderTree";
import { AssetGrid } from "./AssetGrid";
import { AssetFolderMoreMenu } from "./AssetFolderMoreMenu";
import { AssetImportMenu } from "./AssetImportMenu";
import { AssetImageViewerModal } from "./AssetImageViewerModal";
import { AssetNotesEditorHost } from "./AssetNotesEditorHost";
import { useAssetPointerDrag } from "../../hooks/useAssetPointerDrag";
import { ResizablePanelColumn } from "../ResizablePanelColumn";

interface AssetLibraryContentProps {
  library: AssetLibraryIndex;
  workspacePath: string;
  selectedFolderId: string | null;
  selectedAssetId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectAsset: (assetId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onRequestDeleteFolder: (folderId: string) => void;
  onImportClipboard: () => void;
  onImportFile: () => void;
  onStartCanvasCapture: () => void;
  onCreateMarkdownAsset: () => void;
  onUpdateAsset: (
    assetId: string,
    updates: {
      title?: string;
      notes?: string;
      content?: string;
      categoryId?: string | null;
      tagIds?: string[];
    },
  ) => void;
  onDeleteAsset: (assetId: string) => void;
  onRequestMoveAsset: (assetId: string, targetFolderId: string) => void;
  onCreateCategory: (name: string) => void;
  onCreateTag: (name: string) => void;
}

export function AssetLibraryContent({
  library,
  workspacePath,
  selectedFolderId,
  selectedAssetId,
  onSelectFolder,
  onSelectAsset,
  onCreateFolder,
  onRenameFolder,
  onRequestDeleteFolder,
  onImportClipboard,
  onImportFile,
  onStartCanvasCapture,
  onCreateMarkdownAsset,
  onUpdateAsset,
  onDeleteAsset,
  onRequestMoveAsset,
  onCreateCategory,
  onCreateTag,
}: AssetLibraryContentProps) {
  const assetImageViewerAssetId = useAppStore((s) => s.assetImageViewerAssetId);
  const openAssetImageViewer = useAppStore((s) => s.openAssetImageViewer);
  const closeAssetImageViewer = useAppStore((s) => s.closeAssetImageViewer);
  const openAssetNotesEditor = useAppStore((s) => s.openAssetNotesEditor);
  const hasProject = useAppStore((s) => s.project !== null);
  const assetFolderTreeWidth = useAppStore((s) => s.assetFolderTreeWidth);
  const setAssetFolderTreeWidth = useAppStore((s) => s.setAssetFolderTreeWidth);
  const importAssetToNewDrawingLayer = useAppStore((s) => s.importAssetToNewDrawingLayer);
  const importAssetToNewReferenceLayer = useAppStore((s) => s.importAssetToNewReferenceLayer);
  const importAssetColorsToPalette = useAppStore((s) => s.importAssetColorsToPalette);
  const sendAssetToToolPage = useAppStore((s) => s.sendAssetToToolPage);
  const revealAssetInFolder = useAppStore((s) => s.revealAssetInFolder);

  const [contextMenu, setContextMenu] = useState<{
    assetId: string;
    x: number;
    y: number;
  } | null>(null);

  const contextMenuAsset = contextMenu
    ? findAssetById(library, contextMenu.assetId)
    : null;

  const contextMenuItems = useMemo(() => {
    if (!contextMenuAsset) return [];
    return buildAssetContextMenuItems(contextMenuAsset, hasProject, {
      onImportDrawingLayer: (assetId) => void importAssetToNewDrawingLayer(assetId),
      onImportReferenceLayer: (assetId) => void importAssetToNewReferenceLayer(assetId),
      onImportColors: (assetId) => void importAssetColorsToPalette(assetId),
      onSendToToolPage: (assetId, toolPageId) => void sendAssetToToolPage(assetId, toolPageId),
      onRevealInFolder: (assetId) => void revealAssetInFolder(assetId),
    });
  }, [
    contextMenuAsset,
    hasProject,
    importAssetToNewDrawingLayer,
    importAssetToNewReferenceLayer,
    importAssetColorsToPalette,
    sendAssetToToolPage,
    revealAssetInFolder,
  ]);

  const openAssetContextMenu = (assetId: string, clientX: number, clientY: number) => {
    setContextMenu({ assetId, x: clientX, y: clientY });
  };

  const {
    draggingAssetId,
    hoverFolderId,
    beginAssetPointerDrag,
    consumeSuppressClick,
  } = useAssetPointerDrag(onRequestMoveAsset);

  return (
    <>
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
      <ResizablePanelColumn
        width={assetFolderTreeWidth}
        onWidthChange={setAssetFolderTreeWidth}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-700 px-2 py-1.5">
            <AssetImportMenu
              onImportClipboard={onImportClipboard}
              onImportFile={onImportFile}
              onStartCanvasCapture={onStartCanvasCapture}
            />
            <AssetFolderMoreMenu
              selectedFolderId={selectedFolderId}
              onCreateMarkdownAsset={onCreateMarkdownAsset}
              onCreateFolder={onCreateFolder}
              onRequestDeleteFolder={onRequestDeleteFolder}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <AssetFolderTree
              library={library}
              selectedFolderId={selectedFolderId}
              hoverFolderId={hoverFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onRequestDeleteFolder={onRequestDeleteFolder}
            />
          </div>
        </div>
      </ResizablePanelColumn>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AssetGrid
          library={library}
          workspacePath={workspacePath}
          selectedFolderId={selectedFolderId}
          selectedAssetId={selectedAssetId}
          draggingAssetId={draggingAssetId}
          onSelectAsset={onSelectAsset}
          onRequestDeleteAsset={onDeleteAsset}
          onOpenAssetViewer={openAssetImageViewer}
          onOpenAssetNotesEditor={openAssetNotesEditor}
          onOpenAssetContextMenu={openAssetContextMenu}
          onBeginAssetPointerDrag={beginAssetPointerDrag}
          onConsumeSuppressClick={consumeSuppressClick}
        />
      </div>

      {selectedAssetId && (
        <div className="flex h-full min-h-0 w-56 shrink-0 flex-col overflow-hidden border-l border-zinc-700">
          <div className="shrink-0 border-b border-zinc-700 px-2 py-1.5 text-[10px] text-zinc-500">
            详情
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <AssetDetailPanel
              library={library}
              workspacePath={workspacePath}
              selectedAssetId={selectedAssetId}
              onUpdateAsset={onUpdateAsset}
              onDeleteAsset={onDeleteAsset}
              onOpenAssetViewer={openAssetImageViewer}
              onOpenAssetContextMenu={openAssetContextMenu}
              onCreateCategory={onCreateCategory}
              onCreateTag={onCreateTag}
            />
          </div>
        </div>
      )}
    </div>
    <AssetImageViewerModal
      open={assetImageViewerAssetId !== null}
      workspacePath={workspacePath}
      library={library}
      assetId={assetImageViewerAssetId}
      onClose={closeAssetImageViewer}
    />
    <AssetNotesEditorHost
      library={library}
      workspacePath={workspacePath}
      onUpdateAsset={onUpdateAsset}
    />
    {contextMenu && contextMenuItems.length > 0 && (
      <ContextMenu
        position={{ x: contextMenu.x, y: contextMenu.y }}
        items={contextMenuItems}
        onClose={() => setContextMenu(null)}
      />
    )}
    </>
  );
}

export { ROOT_FOLDER_ID } from "@/domain/asset/AssetLibrary";
