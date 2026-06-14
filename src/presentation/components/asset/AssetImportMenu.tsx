import { useState } from "react";
import { MenuDropdown } from "../MenuDropdown";

interface AssetImportMenuProps {
  onImportClipboard: () => void;
  onImportFile: () => void;
  onStartCanvasCapture: () => void;
}

export function AssetImportMenu({
  onImportClipboard,
  onImportFile,
  onStartCanvasCapture,
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
    <MenuDropdown
      label="导入图像 ▾"
      open={open}
      onToggle={() => setOpen((v) => !v)}
      onClose={() => setOpen(false)}
      items={items}
    />
  );
}
