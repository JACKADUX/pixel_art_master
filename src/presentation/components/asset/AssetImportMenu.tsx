import { useState } from "react";
import { MenuDropdown } from "../MenuDropdown";

interface AssetImportMenuProps {
  onImportClipboard: () => void;
  onImportFile: () => void;
  onStartCanvasCapture: () => void;
  onCreateMarkdownAsset: () => void;
}

export function AssetImportMenu({
  onImportClipboard,
  onImportFile,
  onStartCanvasCapture,
  onCreateMarkdownAsset,
}: AssetImportMenuProps) {
  const [open, setOpen] = useState(false);

  const items = [
    {
      type: "action" as const,
      label: "剪贴板",
      onClick: onImportClipboard,
    },
    {
      type: "action" as const,
      label: "文件",
      onClick: onImportFile,
    },
    {
      type: "action" as const,
      label: "画布截图",
      onClick: onStartCanvasCapture,
    },
  ];

  return (
    <div className="flex gap-1">
      <MenuDropdown
        label="导入图像 ▾"
        open={open}
        onToggle={() => setOpen((v) => !v)}
        onClose={() => setOpen(false)}
        items={items}
      />
      <button
        type="button"
        onClick={onCreateMarkdownAsset}
        className="rounded border border-zinc-600 px-2 py-0.5 text-[10px] text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
      >
        新建笔记
      </button>
    </div>
  );
}
