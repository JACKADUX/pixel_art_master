import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { createEmptyProject } from "@/domain/project/Project";
import { importAssetColorsToPalette } from "./ImportAssetToProject";

describe("importAssetColorsToPalette", () => {
  it("merges unique non-transparent colors into project palette", () => {
    const project = createEmptyProject();
    const grid = PixelGrid.createEmpty(2, 2);
    grid.setPixel(0, 0, rgba(255, 0, 0, 255));
    grid.setPixel(1, 0, rgba(0, 255, 0, 255));
    grid.setPixel(0, 1, rgba(255, 0, 0, 255));

    const { project: next, addedCount } = importAssetColorsToPalette(project, grid);

    expect(addedCount).toBe(2);
    expect(next.palette.getColors().length).toBe(2);
  });

  it("skips colors already in palette", () => {
    const project = createEmptyProject();
    project.palette.addFromHex("#ff0000ff");

    const grid = PixelGrid.createEmpty(1, 1);
    grid.setPixel(0, 0, rgba(255, 0, 0, 255));

    const { addedCount } = importAssetColorsToPalette(project, grid);

    expect(addedCount).toBe(0);
  });
});
