import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import {
  captureCanvasSnapshot,
  createIdleTileSession,
  finalizeTileSession,
} from "./TileSession";

describe("TileSession", () => {
  it("starts in idle phase", () => {
    const session = createIdleTileSession();
    expect(session.phase).toBe("idle");
    expect(session.peripheralSnapshot).toBeNull();
  });

  it("finalize keeps center pixels and restores peripheral areas", () => {
    const grid = PixelGrid.createEmpty(20, 20);
    const region = { x: 8, y: 8, width: 4, height: 4 };

    const red = rgba(255, 0, 0, 255);
    const blue = rgba(0, 0, 255, 255);
    const green = rgba(0, 255, 0, 255);

    grid.setPixel(4, 8, blue);
    grid.setPixel(12, 8, green);
    grid.setPixel(9, 9, red);

    const snapshot = captureCanvasSnapshot(grid);

    grid.setPixel(4, 8, red);
    grid.setPixel(12, 8, red);
    grid.setPixel(9, 9, green);
    grid.setPixel(10, 10, green);

    finalizeTileSession(grid, region, snapshot);

    expect(grid.getPixel(9, 9)).toBe(green);
    expect(grid.getPixel(10, 10)).toBe(green);
    expect(grid.getPixel(4, 8)).toBe(blue);
    expect(grid.getPixel(12, 8)).toBe(green);
  });
});
