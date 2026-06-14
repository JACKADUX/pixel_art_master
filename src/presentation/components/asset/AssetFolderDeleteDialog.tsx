import { useEffect } from "react";
import type { AssetFolderDeletionDisposition } from "@/domain/asset/AssetLibrary";

interface AssetFolderDeleteDialogProps {
  open: boolean;
  folderName: string;
  assetCount: number;
  childFolderCount: number;
  onConfirm: (disposition: AssetFolderDeletionDisposition) => void;
  onCancel: () => void;
}

export function AssetFolderDeleteDialog({
  open,
  folderName,
  assetCount,
  childFolderCount,
  onConfirm,
  onCancel,
}: AssetFolderDeleteDialogProps) {
  const hasContents = assetCount > 0 || childFolderCount > 0;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        onConfirm("moveAssetsToRoot");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/70">
      <div className="w-[28rem] rounded-lg border border-zinc-600 bg-zinc-900 p-5 shadow-xl">
        <h3 className="mb-2 text-sm font-semibold text-zinc-100">删除文件夹</h3>
        <p className="mb-4 text-sm text-zinc-400">
          确定删除文件夹「{folderName}」吗？
          {hasContents && (
            <>
              <br />
              包含 {childFolderCount} 个子文件夹、{assetCount} 个资产。资产将移至根目录。
            </>
          )}
        </p>

        {hasContents && (
          <button
            type="button"
            onClick={() => onConfirm("deleteAssets")}
            className="mb-4 text-left text-xs text-red-400 hover:text-red-300 hover:underline"
          >
            删除文件夹及其中所有资产
          </button>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirm("moveAssetsToRoot")}
            className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
