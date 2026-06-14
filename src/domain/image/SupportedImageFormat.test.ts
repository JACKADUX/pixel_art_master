import { describe, expect, it } from "vitest";
import {
  isSupportedImageFile,
  isSupportedImageFileName,
  isSupportedImagePath,
  pickSupportedImagePath,
} from "./SupportedImageFormat";

describe("SupportedImageFormat", () => {
  it("accepts common image extensions", () => {
    expect(isSupportedImageFileName("sprite.png")).toBe(true);
    expect(isSupportedImageFileName("photo.JPG")).toBe(true);
    expect(isSupportedImageFileName("tile.webp")).toBe(true);
  });

  it("rejects non-image extensions", () => {
    expect(isSupportedImageFileName("notes.txt")).toBe(false);
    expect(isSupportedImageFileName("archive.zip")).toBe(false);
  });

  it("accepts image mime type or extension on File", () => {
    expect(isSupportedImageFile(new File([], "a.png", { type: "image/png" }))).toBe(true);
    expect(isSupportedImageFile(new File([], "a.bmp", { type: "" }))).toBe(true);
    expect(isSupportedImageFile(new File([], "a.txt", { type: "text/plain" }))).toBe(false);
  });

  it("accepts filesystem paths with supported extensions", () => {
    expect(isSupportedImagePath("C:\\Users\\me\\Pictures\\sprite.png")).toBe(true);
    expect(isSupportedImagePath("/home/me/sprite.png")).toBe(true);
    expect(pickSupportedImagePath(["notes.txt", "C:\\a\\b\\tile.webp"])).toBe("C:\\a\\b\\tile.webp");
  });
});
