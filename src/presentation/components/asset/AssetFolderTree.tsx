import { useState } from "react";
import {
  listChildFolders,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import type { AssetFolder } from "@/domain/asset/AssetFolder";
import { FOLDER_DROP_TARGET_ATTR } from "./assetPointerDrag";
import { ContextMenu } from "../ContextMenu";
import type { MenuItem } from "../MenuDropdown";

interface AssetFolderTreeProps {
  library: AssetLibraryIndex;
  selectedFolderId: string | null;
  hoverFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onRequestDeleteFolder: (folderId: string) => void;
}

interface FolderContextMenuState {
  folder: AssetFolder;
  x: number;
  y: number;
}

interface TreeNodeProps {
  folder: AssetFolder;
  library: AssetLibraryIndex;
  depth: number;
  selectedFolderId: string | null;
  hoverFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onOpenContextMenu: (folder: AssetFolder, x: number, y: number) => void;
}

function TreeNode({
  folder,
  library,
  depth,
  selectedFolderId,
  hoverFolderId,
  onSelectFolder,
  onRenameFolder,
  onOpenContextMenu,
}: TreeNodeProps) {
  const folderId = folder.id;
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const children = listChildFolders(library, folder.id);
  const label = folder.name;
  const isSelected = selectedFolderId === folderId;
  const isHoverTarget = hoverFolderId === folderId;

  const handleStartRename = (f: AssetFolder) => {
    setEditingId(f.id);
    setEditName(f.name);
  };

  const handleCommitRename = (f: AssetFolder) => {
    if (editName.trim()) onRenameFolder(f.id, editName);
    setEditingId(null);
    setEditName("");
  };

  return (
    <div>
      <div
        {...{ [FOLDER_DROP_TARGET_ATTR]: folderId }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault();
          onOpenContextMenu(folder, e.clientX, e.clientY);
        }}
        className={`group flex items-center gap-1 rounded px-0.5 py-0.5 ${
          isHoverTarget
            ? "bg-blue-900/50 ring-1 ring-blue-500"
            : isSelected
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-400 hover:bg-zinc-800"
        }`}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {children.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] text-zinc-500"
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {editingId === folder.id ? (
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => handleCommitRename(folder)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommitRename(folder);
              if (e.key === "Escape") setEditingId(null);
            }}
            className="min-w-0 flex-1 rounded border border-zinc-600 bg-zinc-800 px-1 text-xs text-zinc-200 outline-none"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => onSelectFolder(folderId)}
            onDoubleClick={() => handleStartRename(folder)}
            className="min-w-0 flex-1 truncate text-left text-xs"
          >
            {label}
          </button>
        )}
      </div>

      {expanded &&
        children.map((child) => (
          <TreeNode
            key={child.id}
            folder={child}
            library={library}
            depth={depth + 1}
            selectedFolderId={selectedFolderId}
            hoverFolderId={hoverFolderId}
            onSelectFolder={onSelectFolder}
            onRenameFolder={onRenameFolder}
            onOpenContextMenu={onOpenContextMenu}
          />
        ))}
    </div>
  );
}

export function AssetFolderTree({
  library,
  selectedFolderId,
  hoverFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onRequestDeleteFolder,
}: AssetFolderTreeProps) {
  const [contextMenu, setContextMenu] = useState<FolderContextMenuState | null>(null);

  const contextMenuItems: MenuItem[] = contextMenu
    ? [
        {
          type: "action",
          label: "新建子文件夹",
          onClick: () => onCreateFolder(contextMenu.folder.id),
        },
        { type: "separator" },
        {
          type: "action",
          label: "删除文件夹",
          onClick: () => onRequestDeleteFolder(contextMenu.folder.id),
        },
      ]
    : [];
  const rootFolders = listChildFolders(library, null);

  return (
    <div
      className="h-full min-h-0 overflow-auto py-2 pr-2"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelectFolder(null);
      }}
    >
      {rootFolders.map((folder) => (
        <TreeNode
          key={folder.id}
          folder={folder}
          library={library}
          depth={0}
          selectedFolderId={selectedFolderId}
          hoverFolderId={hoverFolderId}
          onSelectFolder={onSelectFolder}
          onRenameFolder={onRenameFolder}
          onOpenContextMenu={(folder, x, y) => setContextMenu({ folder, x, y })}
        />
      ))}
      {contextMenu && contextMenuItems.length > 0 && (
        <ContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
