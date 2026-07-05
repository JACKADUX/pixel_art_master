import {
  listAssetsInFolder,
  resolveAssetFolderTarget,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import { isImageAsset, isMarkdownAsset, type AssetRecord } from "@/domain/asset/AssetRecord";
import { useAssetImageUrl } from "@/presentation/hooks/useAssetImageUrl";

interface AssetGridProps {
  library: AssetLibraryIndex;
  workspacePath: string;
  selectedFolderId: string | null;
  selectedAssetId: string | null;
  draggingAssetId: string | null;
  onSelectAsset: (assetId: string | null) => void;
  onRequestDeleteAsset: (assetId: string) => void;
  onOpenAssetViewer: (assetId: string) => void;
  onOpenAssetNotesEditor: (assetId: string) => void;
  onOpenAssetContextMenu: (assetId: string, clientX: number, clientY: number) => void;
  onBeginAssetPointerDrag: (e: React.PointerEvent, assetId: string) => void;
  onConsumeSuppressClick: () => boolean;
}

function ImageAssetThumbnail({
  workspacePath,
  asset,
}: {
  workspacePath: string;
  asset: AssetRecord;
}) {
  const src = useAssetImageUrl(
    workspacePath,
    isImageAsset(asset) ? asset.imageFile : null,
  );

  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-[10px] text-zinc-600">
        ...
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={asset.title}
      draggable={false}
      className="absolute inset-0 h-full w-full object-contain p-1"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

function MarkdownAssetThumbnail({ asset }: { asset: AssetRecord }) {
  const initials = asset.title.trim().slice(0, 2) || "笔记";
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-zinc-900 p-1">
      <span className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">MD</span>
      <span className="max-w-full truncate px-1 text-[10px] text-zinc-400">{initials}</span>
    </div>
  );
}

function AssetThumbnail({
  workspacePath,
  asset,
}: {
  workspacePath: string;
  asset: AssetRecord;
}) {
  if (isMarkdownAsset(asset)) {
    return <MarkdownAssetThumbnail asset={asset} />;
  }
  return <ImageAssetThumbnail workspacePath={workspacePath} asset={asset} />;
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
  onOpenAssetNotesEditor,
  onOpenAssetContextMenu,
  onBeginAssetPointerDrag,
  onConsumeSuppressClick,
}: AssetGridProps) {
  const assets = listAssetsInFolder(
    library,
    resolveAssetFolderTarget(selectedFolderId),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="min-h-0 flex-1 overflow-auto p-2"
        onClick={() => {
          if (selectedAssetId) onSelectAsset(null);
        }}
      >
        {assets.length === 0 ? (
          <p className="text-xs text-zinc-500">此文件夹暂无资产</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] items-start gap-2">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onConsumeSuppressClick()) return;
                    onSelectAsset(asset.id);
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    if (isImageAsset(asset)) {
                      onOpenAssetViewer(asset.id);
                    } else if (isMarkdownAsset(asset)) {
                      onSelectAsset(asset.id);
                      onOpenAssetNotesEditor(asset.id);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onOpenAssetContextMenu(asset.id, e.clientX, e.clientY);
                  }}
                  className="asset-drag-source flex cursor-grab flex-col text-left active:cursor-grabbing"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-zinc-900">
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
