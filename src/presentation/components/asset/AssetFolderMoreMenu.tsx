import { useMemo, useRef, useState } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { ContextMenu } from "../ContextMenu";
import {
  buildAssetFolderPanelMenuItems,
  type AssetFolderPanelMenuActions,
} from "../../config/assetFolderPanelMenu";

interface AssetFolderMoreMenuProps {
  selectedFolderId: string | null;
  onCreateMarkdownAsset: () => void;
  onCreateFolder: (parentId: string | null) => void;
  onRequestDeleteFolder: (folderId: string) => void;
}

export function AssetFolderMoreMenu({
  selectedFolderId,
  onCreateMarkdownAsset,
  onCreateFolder,
  onRequestDeleteFolder,
}: AssetFolderMoreMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const actions = useMemo<AssetFolderPanelMenuActions>(
    () => ({
      createMarkdownAsset: onCreateMarkdownAsset,
      createFolder: () => onCreateFolder(selectedFolderId),
      requestDeleteFolder: () => {
        if (selectedFolderId) onRequestDeleteFolder(selectedFolderId);
      },
    }),
    [onCreateMarkdownAsset, onCreateFolder, onRequestDeleteFolder, selectedFolderId],
  );

  const items = useMemo(
    () =>
      buildAssetFolderPanelMenuItems(actions, {
        hasFolderSelected: selectedFolderId !== null,
      }),
    [actions, selectedFolderId],
  );

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ x: rect.left, y: rect.bottom + 2 });
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title="更多"
        aria-label="资产库更多操作"
        onClick={() => (position ? setPosition(null) : openMenu())}
        className={`flex h-7 w-7 items-center justify-center rounded text-zinc-300 transition hover:bg-zinc-700 hover:text-zinc-100 ${
          position ? "bg-zinc-700 text-zinc-100" : ""
        }`}
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>
      {position && (
        <ContextMenu
          position={position}
          items={items}
          onClose={() => setPosition(null)}
        />
      )}
    </>
  );
}
