import { ROOT_FOLDER_ID, type AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import { AssetDetailPanel } from "./AssetDetailPanel";
import { AssetFolderTree } from "./AssetFolderTree";
import { AssetGrid } from "./AssetGrid";

interface AssetLibraryContentProps {
  library: AssetLibraryIndex;
  workspacePath: string;
  selectedFolderId: string;
  selectedAssetId: string | null;
  onSelectFolder: (folderId: string) => void;
  onSelectAsset: (assetId: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onImportClipboard: () => void;
  onImportFile: () => void;
  onStartCanvasCapture: () => void;
  onUpdateAsset: (
    assetId: string,
    updates: {
      title?: string;
      notes?: string;
      categoryId?: string | null;
      tagIds?: string[];
    },
  ) => void;
  onDeleteAsset: (assetId: string) => void;
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
  onImportClipboard,
  onImportFile,
  onStartCanvasCapture,
  onUpdateAsset,
  onDeleteAsset,
  onCreateCategory,
  onCreateTag,
}: AssetLibraryContentProps) {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex w-40 shrink-0 flex-col border-r border-zinc-700">
        <div className="shrink-0 border-b border-zinc-700 px-2 py-1.5 text-[10px] text-zinc-500">
          文件夹
        </div>
        <AssetFolderTree
          library={library}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
        />
        <button
          type="button"
          onClick={() => onCreateFolder(null)}
          className="shrink-0 border-t border-zinc-700 px-2 py-1.5 text-[10px] text-blue-400 hover:bg-zinc-800"
        >
          + 根级文件夹
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col border-r border-zinc-700">
        <AssetGrid
          library={library}
          workspacePath={workspacePath}
          selectedFolderId={selectedFolderId}
          selectedAssetId={selectedAssetId}
          onSelectAsset={onSelectAsset}
          onImportClipboard={onImportClipboard}
          onImportFile={onImportFile}
          onStartCanvasCapture={onStartCanvasCapture}
        />
      </div>

      <div className="flex w-56 shrink-0 flex-col min-h-0">
        <div className="shrink-0 border-b border-zinc-700 px-2 py-1.5 text-[10px] text-zinc-500">
          详情
        </div>
        <AssetDetailPanel
          library={library}
          workspacePath={workspacePath}
          selectedAssetId={selectedAssetId}
          onUpdateAsset={onUpdateAsset}
          onDeleteAsset={onDeleteAsset}
          onCreateCategory={onCreateCategory}
          onCreateTag={onCreateTag}
        />
      </div>
    </div>
  );
}

export { ROOT_FOLDER_ID };
