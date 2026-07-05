import { useCallback } from "react";
import { findAssetById, type AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import { isImageAsset, isMarkdownAsset } from "@/domain/asset/AssetRecord";
import { useAssetNoteContent } from "@/presentation/hooks/useAssetNoteContent";
import { useAppStore } from "../../stores/appStore";
import { AssetNotesModal } from "./AssetNotesModal";

interface AssetNotesEditorHostProps {
  library: AssetLibraryIndex;
  workspacePath: string;
  onUpdateAsset: (
    assetId: string,
    updates: {
      notes?: string;
      content?: string;
    },
  ) => void;
}

export function AssetNotesEditorHost({
  library,
  workspacePath,
  onUpdateAsset,
}: AssetNotesEditorHostProps) {
  const assetNotesEditor = useAppStore((s) => s.assetNotesEditor);
  const closeAssetNotesEditor = useAppStore((s) => s.closeAssetNotesEditor);

  const assetId = assetNotesEditor?.assetId ?? null;
  const initialMode = assetNotesEditor?.mode ?? "edit";

  const asset = assetId ? findAssetById(library, assetId) : null;

  const { content: markdownContent, loading } = useAssetNoteContent(
    workspacePath,
    asset && isMarkdownAsset(asset) ? asset.contentFile : null,
  );

  const handleSave = useCallback(
    (newValue: string) => {
      if (!assetId || !asset) return;
      if (isImageAsset(asset)) {
        onUpdateAsset(assetId, { notes: newValue });
      } else if (isMarkdownAsset(asset)) {
        onUpdateAsset(assetId, { content: newValue });
      }
    },
    [assetId, asset, onUpdateAsset],
  );

  const handleClose = useCallback(() => {
    closeAssetNotesEditor();
  }, [closeAssetNotesEditor]);

  if (!asset || (isMarkdownAsset(asset) && loading)) return null;

  const value = isImageAsset(asset) ? asset.notes || "" : markdownContent;

  return (
    <AssetNotesModal
      key={assetId}
      open={assetNotesEditor !== null}
      title={asset.title}
      value={value}
      initialMode={initialMode}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
}
