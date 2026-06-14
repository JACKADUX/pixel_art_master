import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { listAssetsInFolder, type AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import type { AssetRecord } from "@/domain/asset/AssetRecord";

interface AssetGridProps {
  library: AssetLibraryIndex;
  workspacePath: string;
  selectedFolderId: string;
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
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
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const root = workspacePath.replace(/[/\\]+$/, "");
    const separator = root.includes("\\") ? "\\" : "/";
    const fullPath = `${root}${separator}.pixelart-assets${separator}${asset.imageFile.replace(/\//g, separator)}`;
    setSrc(convertFileSrc(fullPath));
  }, [workspacePath, asset.imageFile]);

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
  onSelectAsset,
  onImportClipboard,
  onImportFile,
  onStartCanvasCapture,
}: AssetGridProps) {
  const assets = listAssetsInFolder(library, selectedFolderId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 gap-1 border-b border-zinc-700 p-2">
        <button
          type="button"
          onClick={onImportClipboard}
          className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700"
        >
          剪贴板
        </button>
        <button
          type="button"
          onClick={onImportFile}
          className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700"
        >
          文件
        </button>
        <button
          type="button"
          onClick={onStartCanvasCapture}
          className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700"
        >
          画布截图
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {assets.length === 0 ? (
          <p className="text-xs text-zinc-500">此文件夹暂无资产</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => onSelectAsset(asset.id)}
                className={`flex flex-col overflow-hidden rounded border ${
                  selectedAssetId === asset.id
                    ? "border-blue-500 bg-zinc-800"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                }`}
              >
                <div className="aspect-square w-full bg-zinc-900 p-1">
                  <AssetThumbnail workspacePath={workspacePath} asset={asset} />
                </div>
                <span className="truncate px-1 py-0.5 text-[10px] text-zinc-400">
                  {asset.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
