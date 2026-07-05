import { useCallback, useEffect, useState } from "react";
import { findAssetById, type AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import { isImageAsset, isMarkdownAsset } from "@/domain/asset/AssetRecord";
import { useAssetImageUrl } from "@/presentation/hooks/useAssetImageUrl";
import { useAssetNoteContent } from "@/presentation/hooks/useAssetNoteContent";
import { useAppStore } from "../../stores/appStore";
import { AssetNotesSection, type AssetNotesModalMode } from "./AssetNotesSection";

interface AssetDetailPanelProps {
  library: AssetLibraryIndex;
  workspacePath: string;
  selectedAssetId: string | null;
  onUpdateAsset: (
    assetId: string,
    updates: {
      title?: string;
      notes?: string;
      content?: string;
      categoryId?: string | null;
      tagIds?: string[];
    },
  ) => void;
  onDeleteAsset: (assetId: string) => void;
  onOpenAssetViewer: (assetId: string) => void;
  onOpenAssetContextMenu: (assetId: string, clientX: number, clientY: number) => void;
  onCreateCategory: (name: string) => void;
  onCreateTag: (name: string) => void;
}

export function AssetDetailPanel({
  library,
  workspacePath,
  selectedAssetId,
  onUpdateAsset,
  onDeleteAsset,
  onOpenAssetViewer,
  onOpenAssetContextMenu,
  onCreateCategory,
  onCreateTag,
}: AssetDetailPanelProps) {
  const asset = selectedAssetId ? findAssetById(library, selectedAssetId) : null;
  const openAssetNotesEditor = useAppStore((s) => s.openAssetNotesEditor);
  const previewSrc = useAssetImageUrl(
    workspacePath,
    asset && isImageAsset(asset) ? asset.imageFile : null,
  );
  const { content: markdownContent } = useAssetNoteContent(
    workspacePath,
    asset && isMarkdownAsset(asset) ? asset.contentFile : null,
  );

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [content, setContent] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  useEffect(() => {
    if (!asset) {
      setTitle("");
      setNotes("");
      setContent("");
      return;
    }
    setTitle(asset.title);
    if (isImageAsset(asset)) {
      setNotes(asset.notes);
    }
  }, [selectedAssetId, asset?.id, asset?.title, asset && isImageAsset(asset) ? asset.notes : null]);

  useEffect(() => {
    if (!asset || !isMarkdownAsset(asset)) return;
    setContent(markdownContent);
  }, [selectedAssetId, asset?.id, markdownContent]);

  const handleNotesSave = useCallback(
    (value: string) => {
      setNotes(value);
      if (!selectedAssetId) return;
      onUpdateAsset(selectedAssetId, { notes: value });
    },
    [selectedAssetId, onUpdateAsset],
  );

  const handleContentSave = useCallback(
    (value: string) => {
      setContent(value);
      if (!selectedAssetId) return;
      onUpdateAsset(selectedAssetId, { content: value });
    },
    [selectedAssetId, onUpdateAsset],
  );

  if (!asset) {
    return (
      <div className="flex min-h-[6rem] items-center justify-center p-4 text-xs text-zinc-500">
        选择资产以查看详情
      </div>
    );
  }

  const handleTitleBlur = () => {
    if (title.trim() && title !== asset.title) {
      onUpdateAsset(asset.id, { title });
    }
  };

  const openNotesModal = (mode: AssetNotesModalMode) => {
    openAssetNotesEditor(asset.id, mode);
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
    <div className="p-3">
      {isImageAsset(asset) && previewSrc && (
        <button
          type="button"
          title="双击放大查看"
          onDoubleClick={() => onOpenAssetViewer(asset.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            onOpenAssetContextMenu(asset.id, e.clientX, e.clientY);
          }}
          className="mb-3 flex w-full justify-center rounded border border-zinc-700 bg-zinc-950 p-2 hover:border-zinc-600"
        >
          <img
            src={previewSrc}
            alt={asset.title}
            className="max-h-32 max-w-full object-contain"
            style={{ imageRendering: "pixelated" }}
            draggable={false}
          />
        </button>
      )}

      {isMarkdownAsset(asset) && (
        <div className="mb-3 flex items-center justify-center rounded border border-zinc-700 bg-zinc-950 p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">MD</span>
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
        {isImageAsset(asset) && (
          <>
            尺寸: {asset.width}×{asset.height} · 颜色: {asset.colorCount}
            <br />
          </>
        )}
        {isMarkdownAsset(asset) && (
          <>
            类型: Markdown 笔记
            <br />
          </>
        )}
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

      {isImageAsset(asset) ? (
        <AssetNotesSection
          value={notes}
          onSave={handleNotesSave}
          onOpenFullscreen={openNotesModal}
          placeholder="附属笔记（支持 Markdown）…"
        />
      ) : (
        <AssetNotesSection
          value={content}
          onSave={handleContentSave}
          onOpenFullscreen={openNotesModal}
          label="内容"
          placeholder="双击编辑 Markdown 内容…"
        />
      )}

      <button
        type="button"
        onClick={() => onDeleteAsset(asset.id)}
        className="mt-3 rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-950"
      >
        删除资产
      </button>
    </div>
  );
}
