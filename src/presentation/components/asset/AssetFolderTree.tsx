import { useState } from "react";
import {
  listChildFolders,
  ROOT_FOLDER_ID,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import type { AssetFolder } from "@/domain/asset/AssetFolder";
import { FOLDER_DROP_TARGET_ATTR } from "./assetPointerDrag";

interface AssetFolderTreeProps {
  library: AssetLibraryIndex;
  selectedFolderId: string;
  hoverFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onRequestDeleteFolder: (folderId: string) => void;
}

interface TreeNodeProps {
  folder: AssetFolder | null;
  library: AssetLibraryIndex;
  depth: number;
  selectedFolderId: string;
  hoverFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onRequestDeleteFolder: (folderId: string) => void;
}

function TreeNode({
  folder,
  library,
  depth,
  selectedFolderId,
  hoverFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onRequestDeleteFolder,
}: TreeNodeProps) {
  const folderId = folder?.id ?? ROOT_FOLDER_ID;
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const children = folder
    ? listChildFolders(library, folder.id)
    : listChildFolders(library, null);
  const label = folder?.name ?? "根目录";
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
        className={`group flex items-center gap-1 rounded px-1 py-0.5 ${
          isHoverTarget
            ? "bg-blue-900/50 ring-1 ring-blue-500"
            : isSelected
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-400 hover:bg-zinc-800"
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
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

        {folder && editingId === folder.id ? (
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
            onDoubleClick={() => folder && handleStartRename(folder)}
            className="min-w-0 flex-1 truncate text-left text-xs"
          >
            {label}
          </button>
        )}

        <button
          type="button"
          title="新建子文件夹"
          onClick={() => onCreateFolder(folder?.id ?? null)}
          className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200 group-hover:flex"
        >
          +
        </button>
        {folder && (
          <button
            type="button"
            title="删除文件夹"
            onClick={() => onRequestDeleteFolder(folder.id)}
            className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-red-900 hover:text-red-300 group-hover:flex"
          >
            ×
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
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
            onRequestDeleteFolder={onRequestDeleteFolder}
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
  return (
    <div className="min-h-0 flex-1 overflow-auto p-2">
      <TreeNode
        folder={null}
        library={library}
        depth={0}
        selectedFolderId={selectedFolderId}
        hoverFolderId={hoverFolderId}
        onSelectFolder={onSelectFolder}
        onCreateFolder={onCreateFolder}
        onRenameFolder={onRenameFolder}
        onRequestDeleteFolder={onRequestDeleteFolder}
      />
    </div>
  );
}
