import { useState } from "react";
import {
  listChildFolders,
  ROOT_FOLDER_ID,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import type { AssetFolder } from "@/domain/asset/AssetFolder";

interface AssetFolderTreeProps {
  library: AssetLibraryIndex;
  selectedFolderId: string;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, name: string) => void;
}

interface TreeNodeProps {
  folder: AssetFolder | null;
  library: AssetLibraryIndex;
  depth: number;
  selectedFolderId: string;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, name: string) => void;
}

function TreeNode({
  folder,
  library,
  depth,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
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
        className={`group flex items-center gap-1 rounded px-1 py-0.5 ${
          isSelected ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800"
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
      </div>

      {expanded &&
        children.map((child) => (
          <TreeNode
            key={child.id}
            folder={child}
            library={library}
            depth={depth + 1}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
          />
        ))}
    </div>
  );
}

export function AssetFolderTree({
  library,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
}: AssetFolderTreeProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-2">
      <TreeNode
        folder={null}
        library={library}
        depth={0}
        selectedFolderId={selectedFolderId}
        onSelectFolder={onSelectFolder}
        onCreateFolder={onCreateFolder}
        onRenameFolder={onRenameFolder}
      />
    </div>
  );
}
