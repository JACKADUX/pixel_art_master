import { describe, expect, it } from "vitest";
import {
  selectionModeFromShortcutCode,
  toolFromShortcutCode,
} from "@/presentation/config/toolShortcuts";
import { isTextInputType } from "@/presentation/utils/editableFocus";

describe("toolFromShortcutCode", () => {
  it("maps physical key codes to tools", () => {
    expect(toolFromShortcutCode("KeyB")).toBe("brush");
    expect(toolFromShortcutCode("KeyG")).toBe("fill");
    expect(toolFromShortcutCode("KeyE")).toBe("eraser");
    expect(toolFromShortcutCode("KeyU")).toBe("shape");
    expect(toolFromShortcutCode("KeyV")).toBe("transform");
  });

  it("returns null for unknown codes", () => {
    expect(toolFromShortcutCode("KeyA")).toBeNull();
    expect(toolFromShortcutCode("KeyM")).toBeNull();
    expect(toolFromShortcutCode("Space")).toBeNull();
  });
});

describe("selectionModeFromShortcutCode", () => {
  it("maps physical key codes to selection modes", () => {
    expect(selectionModeFromShortcutCode("KeyM")).toBe("rectangle");
    expect(selectionModeFromShortcutCode("KeyW")).toBe("magicWand");
  });

  it("returns null for unknown codes", () => {
    expect(selectionModeFromShortcutCode("KeyA")).toBeNull();
    expect(selectionModeFromShortcutCode("KeyB")).toBeNull();
  });
});

describe("isTextInputType", () => {
  it("treats text-like input types as text entry", () => {
    expect(isTextInputType("text")).toBe(true);
    expect(isTextInputType("number")).toBe(true);
    expect(isTextInputType("")).toBe(true);
  });

  it("does not treat checkbox or range input types as text entry", () => {
    expect(isTextInputType("checkbox")).toBe(false);
    expect(isTextInputType("range")).toBe(false);
    expect(isTextInputType("radio")).toBe(false);
  });
});
