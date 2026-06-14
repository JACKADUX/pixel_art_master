import { useEffect } from "react";

interface AssetMoveConfirmDialogProps {
  open: boolean;
  assetTitle: string;
  fromFolderLabel: string;
  toFolderLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AssetMoveConfirmDialog({
  open,
  assetTitle,
  fromFolderLabel,
  toFolderLabel,
  onConfirm,
  onCancel,
}: AssetMoveConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/70">
      <div className="w-[28rem] rounded-lg border border-zinc-600 bg-zinc-900 p-5 shadow-xl">
        <h3 className="mb-2 text-sm font-semibold text-zinc-100">移动资产</h3>
        <p className="mb-5 text-sm text-zinc-400">
          确定将资产「{assetTitle}」从「{fromFolderLabel}」移动到「{toFolderLabel}」吗？
        </p>
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
            onClick={onConfirm}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            移动
          </button>
        </div>
      </div>
    </div>
  );
}
