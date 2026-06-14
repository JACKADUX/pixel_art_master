import { listAssetsInFolder, type AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import type { AssetRecord } from "@/domain/asset/AssetRecord";
import { useAssetImageUrl } from "@/presentation/hooks/useAssetImageUrl";
import { AssetImportMenu } from "./AssetImportMenu";

interface AssetGridProps {
  library: AssetLibraryIndex;
  workspacePath: string;
  selectedFolderId: string;
  selectedAssetId: string | null;
  draggingAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
  onRequestDeleteAsset: (assetId: string) => void;
  onOpenAssetViewer: (assetId: string) => void;
  onOpenAssetContextMenu: (assetId: string, clientX: number, clientY: number) => void;
  onBeginAssetPointerDrag: (e: React.PointerEvent, assetId: string) => void;
  onConsumeSuppressClick: () => boolean;
  onImportClipboard: () => void;
  onImportFile: () => void;
  onStartCanvasCapture: () => void;
}

function AssetThumbnail({
  workspacePath,
  asset,
}: {
  workspacePath: string;
  asset: AssetRecord;
}) {
  const src = useAssetImageUrl(workspacePath, asset.imageFile);

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-[10px] text-zinc-600">
        ...
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={asset.title}
      draggable={false}
      className="h-full w-full object-contain"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function AssetGrid({
  library,
  workspacePath,
  selectedFolderId,
  selectedAssetId,
  draggingAssetId,
  onSelectAsset,
  onRequestDeleteAsset,
  onOpenAssetViewer,
  onOpenAssetContextMenu,
  onBeginAssetPointerDrag,
  onConsumeSuppressClick,
  onImportClipboard,
  onImportFile,
  onStartCanvasCapture,
}: AssetGridProps) {
  const assets = listAssetsInFolder(library, selectedFolderId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 border-b border-zinc-700 p-2">
        <AssetImportMenu
          onImportClipboard={onImportClipboard}
          onImportFile={onImportFile}
          onStartCanvasCapture={onStartCanvasCapture}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {assets.length === 0 ? (
          <p className="text-xs text-zinc-500">此文件夹暂无资产</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className={`group relative flex flex-col overflow-hidden rounded border ${
                  selectedAssetId === asset.id
                    ? "border-blue-500 bg-zinc-800"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                } ${draggingAssetId === asset.id ? "opacity-50" : ""}`}
              >
                <button
                  type="button"
                  title="删除资产"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDeleteAsset(asset.id);
                  }}
                  className="absolute right-0.5 top-0.5 z-10 hidden h-4 w-4 items-center justify-center rounded bg-zinc-900/90 text-[10px] text-zinc-400 hover:bg-red-900 hover:text-red-300 group-hover:flex"
                >
                  ×
                </button>
                <div
                  onPointerDown={(e) => onBeginAssetPointerDrag(e, asset.id)}
                  onClick={() => {
                    if (onConsumeSuppressClick()) return;
                    onSelectAsset(asset.id);
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    onOpenAssetViewer(asset.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onOpenAssetContextMenu(asset.id, e.clientX, e.clientY);
                  }}
                  className="asset-drag-source flex cursor-grab flex-col text-left active:cursor-grabbing"
                >
                  <div className="aspect-square w-full bg-zinc-900 p-1">
                    <AssetThumbnail workspacePath={workspacePath} asset={asset} />
                  </div>
                  <span className="truncate px-1 py-0.5 text-[10px] text-zinc-400">
                    {asset.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
