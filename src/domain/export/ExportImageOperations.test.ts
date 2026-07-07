import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import {
  buildDefaultExportSavePath,
  buildExportFilePath,
  computeExportDimensions,
  dirnameFromFilePath,
  sanitizeExportFileName,
  scalePixelGridToLongestEdge,
} from "./ExportImageOperations";

describe("ExportImageOperations", () => {
  describe("sanitizeExportFileName", () => {
    it("removes invalid characters", () => {
      expect(sanitizeExportFileName('foo/bar:baz')).toBe("foobarbaz");
    });

    it("falls back to export for empty names", () => {
      expect(sanitizeExportFileName("   ")).toBe("export");
      expect(sanitizeExportFileName("///")).toBe("export");
    });
  });

  describe("buildExportFilePath", () => {
    it("joins directory, sanitized name and extension", () => {
      expect(buildExportFilePath("/tmp", "my project", "png")).toBe("/tmp/my project.png");
      expect(buildExportFilePath("C:\\out", "test", "webp")).toBe("C:\\out\\test.webp");
      expect(buildExportFilePath("C:\\out", "test", "jpg")).toBe("C:\\out\\test.jpg");
    });
  });

  describe("dirnameFromFilePath", () => {
    it("returns parent directory preserving separator style", () => {
      expect(dirnameFromFilePath("/tmp/my project.png")).toBe("/tmp");
      expect(dirnameFromFilePath("C:\\out\\test.webp")).toBe("C:\\out");
    });
  });

  describe("buildDefaultExportSavePath", () => {
    it("builds a full path when directory is provided", () => {
      expect(buildDefaultExportSavePath("/tmp", "sprite", "png")).toBe("/tmp/sprite.png");
    });

    it("returns filename only when directory is missing", () => {
      expect(buildDefaultExportSavePath(null, "sprite", "webp")).toBe("sprite.webp");
    });
  });

  describe("scalePixelGridToLongestEdge", () => {
    it("scales longest edge to target with nearest neighbor", () => {
      const grid = PixelGrid.createEmpty(16, 32);
      grid.setPixel(0, 0, rgba(255, 0, 0));
      const scaled = scalePixelGridToLongestEdge(grid, 256);
      expect(Math.max(scaled.width, scaled.height)).toBe(256);
      expect(scaled.width).toBe(128);
      expect(scaled.height).toBe(256);
      expect(scaled.getPixel(0, 0)).toBe(rgba(255, 0, 0));
    });

    it("returns same grid when target equals current longest edge", () => {
      const grid = PixelGrid.createEmpty(32, 16);
      expect(scalePixelGridToLongestEdge(grid, 32)).toBe(grid);
    });
  });

  describe("computeExportDimensions", () => {
    it("reports scaled output size", () => {
      const grid = PixelGrid.createEmpty(16, 32);
      const dims = computeExportDimensions(grid, "256", 256);
      expect(dims.sourceWidth).toBe(16);
      expect(dims.sourceHeight).toBe(32);
      expect(dims.outputWidth).toBe(128);
      expect(dims.outputHeight).toBe(256);
    });

    it("keeps dimensions for original preset", () => {
      const grid = PixelGrid.createEmpty(10, 20);
      const dims = computeExportDimensions(grid, "original", 256);
      expect(dims.outputWidth).toBe(10);
      expect(dims.outputHeight).toBe(20);
    });
  });
});
