import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { convertFileSrc } from "@tauri-apps/api/core";
import { findAssetById, type AssetLibraryIndex } from "@/domain/asset/AssetLibrary";

interface AssetDetailPanelProps {
  library: AssetLibraryIndex;
  workspacePath: string;
  selectedAssetId: string | null;
  onUpdateAsset: (
    assetId: string,
    updates: {
      title?: string;
      notes?: string;
      categoryId?: string | null;
      tagIds?: string[];
    },
  ) => void;
  onDeleteAsset: (assetId: string) => void;
  onCreateCategory: (name: string) => void;
  onCreateTag: (name: string) => void;
}

export function AssetDetailPanel({
  library,
  workspacePath,
  selectedAssetId,
  onUpdateAsset,
  onDeleteAsset,
  onCreateCategory,
  onCreateTag,
}: AssetDetailPanelProps) {
  const asset = selectedAssetId ? findAssetById(library, selectedAssetId) : null;
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!asset) {
      setTitle("");
      setNotes("");
      setPreviewSrc(null);
      return;
    }
    setTitle(asset.title);
    setNotes(asset.notes);
    const root = workspacePath.replace(/[/\\]+$/, "");
    const separator = root.includes("\\") ? "\\" : "/";
    const fullPath = `${root}${separator}.pixelart-assets${separator}${asset.imageFile.replace(/\//g, separator)}`;
    setPreviewSrc(convertFileSrc(fullPath));
  }, [asset, workspacePath]);

  if (!asset) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-xs text-zinc-500">
        选择资产以查看详情
      </div>
    );
  }

  const handleTitleBlur = () => {
    if (title.trim() && title !== asset.title) {
      onUpdateAsset(asset.id, { title });
    }
  };

  const handleNotesBlur = () => {
    if (notes !== asset.notes) {
      onUpdateAsset(asset.id, { notes });
    }
  };

  const toggleTag = (tagId: string) => {
    const has = asset.tagIds.includes(tagId);
    const tagIds = has
      ? asset.tagIds.filter((id) => id !== tagId)
      : [...asset.tagIds, tagId];
    onUpdateAsset(asset.id, { tagIds });
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    onCreateCategory(name);
    setNewCategoryName("");
  };

  const handleAddTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    onCreateTag(name);
    setNewTagName("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-3">
      {previewSrc && (
        <div className="mb-3 flex justify-center rounded border border-zinc-700 bg-zinc-950 p-2">
          <img
            src={previewSrc}
            alt={asset.title}
            className="max-h-32 max-w-full object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      )}

      <label className="mb-2 block text-[10px] text-zinc-500">标题</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        className="mb-3 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-blue-500"
      />

      <div className="mb-3 text-[10px] text-zinc-500">
        尺寸: {asset.width}×{asset.height} · 颜色: {asset.colorCount}
        <br />
        创建: {new Date(asset.createdAt).toLocaleString()}
        <br />
        更新: {new Date(asset.updatedAt).toLocaleString()}
      </div>

      <label className="mb-1 block text-[10px] text-zinc-500">分类</label>
      <select
        value={asset.categoryId ?? ""}
        onChange={(e) =>
          onUpdateAsset(asset.id, {
            categoryId: e.target.value ? e.target.value : null,
          })
        }
        className="mb-2 w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none"
      >
        <option value="">无分类</option>
        {library.categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <div className="mb-3 flex gap-1">
        <input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="新建分类"
          className="min-w-0 flex-1 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-200 outline-none"
        />
        <button
          type="button"
          onClick={handleAddCategory}
          className="rounded bg-zinc-700 px-2 text-[10px] text-zinc-300 hover:bg-zinc-600"
        >
          添加
        </button>
      </div>

      <label className="mb-1 block text-[10px] text-zinc-500">标签</label>
      <div className="mb-2 flex flex-wrap gap-1">
        {library.tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={`rounded px-2 py-0.5 text-[10px] ${
              asset.tagIds.includes(tag.id)
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
      <div className="mb-3 flex gap-1">
        <input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="新建标签"
          className="min-w-0 flex-1 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-200 outline-none"
        />
        <button
          type="button"
          onClick={handleAddTag}
          className="rounded bg-zinc-700 px-2 text-[10px] text-zinc-300 hover:bg-zinc-600"
        >
          添加
        </button>
      </div>

      <label className="mb-1 block text-[10px] text-zinc-500">笔记</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleNotesBlur}
        placeholder="附属笔记（支持 Markdown）..."
        className="mb-2 h-20 w-full resize-none rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500"
      />
      {notes && (
        <div className="mb-3 max-h-24 overflow-auto rounded border border-zinc-700 bg-zinc-950 p-2">
          <div className="prose prose-invert prose-xs max-w-none text-zinc-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onDeleteAsset(asset.id)}
        className="mt-auto rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-950"
      >
        删除资产
      </button>
    </div>
  );
}
