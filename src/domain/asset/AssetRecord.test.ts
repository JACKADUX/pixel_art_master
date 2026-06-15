import { describe, expect, it, vi } from "vitest";
import {
  createImageAssetRecord,
  createMarkdownAssetRecord,
  isImageAsset,
  isMarkdownAsset,
  updateAssetNotes,
  updateMarkdownAssetContent,
} from "@/domain/asset/AssetRecord";
import { metadataFromPixelGrid } from "@/domain/asset/AssetMetadata";
import {
  addMarkdownAssetToLibrary,
  createEmptyAssetLibrary,
  updateAssetInLibrary,
} from "@/domain/asset/AssetLibrary";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { deserializeAssetLibrary } from "@/infrastructure/storage/AssetIndexSerializer";

describe("AssetRecord", () => {
  it("creates image asset with kind image", () => {
    const grid = PixelGrid.createEmpty(4, 4);
    const asset = createImageAssetRecord(
      "__root__",
      "images/test.png",
      metadataFromPixelGrid(grid),
    );

    expect(asset.kind).toBe("image");
    expect(isImageAsset(asset)).toBe(true);
    expect(asset.notes).toBe("");
  });

  it("creates markdown asset with kind markdown", () => {
    const asset = createMarkdownAssetRecord("__root__", "notes/test.md", "我的笔记");

    expect(asset.kind).toBe("markdown");
    expect(isMarkdownAsset(asset)).toBe(true);
    expect(asset.title).toBe("我的笔记");
  });

  it("updates notes only on image assets in library", () => {
    const grid = PixelGrid.createEmpty(2, 2);
    let library = createEmptyAssetLibrary();
    const image = createImageAssetRecord(
      "__root__",
      "images/a.png",
      metadataFromPixelGrid(grid),
    );
    library = { ...library, assets: [image] };

    const updated = updateAssetInLibrary(library, image.id, { notes: "hello" });
    const result = updated.assets[0];

    expect(isImageAsset(result)).toBe(true);
    if (isImageAsset(result)) {
      expect(result.notes).toBe("hello");
    }
  });

  it("touches markdown asset when content is saved", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    const asset = createMarkdownAssetRecord("__root__", "notes/a.md");
    let library = createEmptyAssetLibrary();
    library = { ...library, assets: [asset] };

    vi.setSystemTime(new Date("2024-01-02T00:00:00.000Z"));
    const updated = updateAssetInLibrary(library, asset.id, { content: "# Title" });
    const result = updated.assets[0];

    expect(isMarkdownAsset(result)).toBe(true);
    expect(result.updatedAt).not.toBe(asset.updatedAt);
    vi.useRealTimers();
  });

  it("adds markdown asset to library", () => {
    const library = createEmptyAssetLibrary();
    const { library: next, asset } = addMarkdownAssetToLibrary(
      library,
      "__root__",
      "notes/new.md",
      "笔记",
    );

    expect(next.assets).toHaveLength(1);
    expect(isMarkdownAsset(asset)).toBe(true);
  });
});

describe("AssetIndexSerializer backward compatibility", () => {
  it("deserializes legacy image asset without kind as image", () => {
    const json = JSON.stringify({
      version: 1,
      folders: [],
      categories: [],
      tags: [],
      assets: [
        {
          id: "legacy-id",
          folderId: "__root__",
          title: "旧资产",
          notes: "note",
          categoryId: null,
          tagIds: [],
          imageFile: "images/legacy-id.png",
          width: 16,
          height: 16,
          colorCount: 2,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    });

    const library = deserializeAssetLibrary(json);
    const asset = library.assets[0];

    expect(isImageAsset(asset)).toBe(true);
    if (isImageAsset(asset)) {
      expect(asset.notes).toBe("note");
      expect(asset.imageFile).toBe("images/legacy-id.png");
    }
  });

  it("deserializes markdown asset with kind", () => {
    const json = JSON.stringify({
      version: 2,
      folders: [],
      categories: [],
      tags: [],
      assets: [
        {
          kind: "markdown",
          id: "md-id",
          folderId: "__root__",
          title: "笔记",
          categoryId: null,
          tagIds: [],
          contentFile: "notes/md-id.md",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    });

    const library = deserializeAssetLibrary(json);
    const asset = library.assets[0];

    expect(isMarkdownAsset(asset)).toBe(true);
    if (isMarkdownAsset(asset)) {
      expect(asset.contentFile).toBe("notes/md-id.md");
    }
  });
});

describe("AssetRecord mutators", () => {
  it("updateAssetNotes touches updatedAt", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    const grid = PixelGrid.createEmpty(1, 1);
    const asset = createImageAssetRecord(
      "__root__",
      "images/x.png",
      metadataFromPixelGrid(grid),
    );
    vi.setSystemTime(new Date("2024-01-02T00:00:00.000Z"));
    const updated = updateAssetNotes(asset, "new note");
    expect(updated.notes).toBe("new note");
    expect(updated.updatedAt).not.toBe(asset.updatedAt);
    vi.useRealTimers();
  });

  it("updateMarkdownAssetContent touches updatedAt", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    const asset = createMarkdownAssetRecord("__root__", "notes/x.md");
    vi.setSystemTime(new Date("2024-01-02T00:00:00.000Z"));
    const updated = updateMarkdownAssetContent(asset);
    expect(updated.updatedAt).not.toBe(asset.updatedAt);
    vi.useRealTimers();
  });
});
