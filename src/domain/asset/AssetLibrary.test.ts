import { describe, expect, it } from "vitest";
import {
  countAssetsInFolders,
  listDescendantFolderIds,
  removeFolderTreeFromLibrary,
  ROOT_FOLDER_ID,
  createEmptyAssetLibrary,
  addFolder,
  addAssetToLibrary,
} from "@/domain/asset/AssetLibrary";
import { metadataFromPixelGrid } from "@/domain/asset/AssetMetadata";
import { PixelGrid } from "@/domain/canvas/PixelGrid";

describe("removeFolderTreeFromLibrary", () => {
  it("moves assets to root when disposition is moveAssetsToRoot", () => {
    let library = createEmptyAssetLibrary();
    library = addFolder(library, "子文件夹", null);
    const folderId = library.folders[0].id;
    const grid = PixelGrid.createEmpty(2, 2);
    const { library: withAsset } = addAssetToLibrary(
      library,
      folderId,
      "images/test.png",
      metadataFromPixelGrid(grid),
    );

    const { library: result } = removeFolderTreeFromLibrary(
      withAsset,
      folderId,
      "moveAssetsToRoot",
    );

    expect(result.folders).toHaveLength(0);
    expect(result.assets[0].folderId).toBe(ROOT_FOLDER_ID);
  });

  it("removes assets when disposition is deleteAssets", () => {
    let library = createEmptyAssetLibrary();
    library = addFolder(library, "待删", null);
    const folderId = library.folders[0].id;
    const grid = PixelGrid.createEmpty(1, 1);
    const { library: withAsset } = addAssetToLibrary(
      library,
      folderId,
      "images/test.png",
      metadataFromPixelGrid(grid),
    );

    const { library: result, removedAssets } = removeFolderTreeFromLibrary(
      withAsset,
      folderId,
      "deleteAssets",
    );

    expect(result.assets).toHaveLength(0);
    expect(removedAssets).toHaveLength(1);
  });

  it("lists descendant folder ids", () => {
    let library = createEmptyAssetLibrary();
    library = addFolder(library, "父", null);
    const parentId = library.folders[0].id;
    library = addFolder(library, "子", parentId);
    const childId = library.folders[1].id;

    const ids = listDescendantFolderIds(library, parentId);
    expect(ids).toEqual([parentId, childId]);
    expect(countAssetsInFolders(library, ids)).toBe(0);
  });
});
