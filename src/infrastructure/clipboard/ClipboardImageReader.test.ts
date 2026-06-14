import { describe, expect, it, vi, afterEach } from "vitest";
import { readClipboardImageData } from "./ClipboardImageReader";

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: vi.fn(() => false),
}));

vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({
  readImage: vi.fn(),
}));

describe("readClipboardImageData", () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
    vi.clearAllMocks();
  });

  it("returns null when clipboard has no image", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        read: vi.fn(async () => [{ types: ["text/plain"], getType: vi.fn() }]),
      },
    });

    await expect(readClipboardImageData()).resolves.toBeNull();
  });

  it("returns null when clipboard read is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {},
    });

    await expect(readClipboardImageData()).resolves.toBeNull();
  });
});
