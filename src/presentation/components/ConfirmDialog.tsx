import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** 覆盖遮罩层级（默认 z-[60]），用于在更高层级的弹窗内二次确认 */
  zClassName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确认",
  cancelLabel = "取消",
  danger = false,
  zClassName = "z-[60]",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return createPortal(
    <div className={`fixed inset-0 ${zClassName} flex items-center justify-center bg-black/70`}>
      <div className="w-96 rounded-lg border border-zinc-600 bg-zinc-900 p-5 shadow-xl">
        <h3 className="mb-2 text-sm font-semibold text-zinc-100">{title}</h3>
        <p className="mb-5 text-sm text-zinc-400">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded px-3 py-1.5 text-xs font-medium text-white ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
