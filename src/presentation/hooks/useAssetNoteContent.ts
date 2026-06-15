import { useEffect, useState } from "react";
import { readMarkdownAssetContent } from "@/application/use-cases/AssetRecordUseCases";
import { assetLibraryRepository } from "@/infrastructure/storage/FileAssetLibraryRepository";

export function useAssetNoteContent(
  workspacePath: string,
  contentFile: string | null | undefined,
): { content: string; loading: boolean } {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspacePath || !contentFile) {
      setContent("");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void readMarkdownAssetContent(
      assetLibraryRepository,
      workspacePath,
      contentFile,
    ).then((text) => {
      if (cancelled) return;
      setContent(text);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [workspacePath, contentFile]);

  return { content, loading };
}
