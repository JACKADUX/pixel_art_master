import { describe, expect, it } from "vitest";
import { shouldDeferShortcutToTextEntryWhen } from "@/presentation/utils/editableFocus";

describe("shouldDeferShortcutToTextEntryWhen", () => {
  it("defers unmodified keys when a text input is focused", () => {
    expect(shouldDeferShortcutToTextEntryWhen(true, { ctrlKey: false, metaKey: false, altKey: false })).toBe(
      true,
    );
  });

  it("does not defer modifier shortcuts when a text input is focused", () => {
    expect(shouldDeferShortcutToTextEntryWhen(true, { ctrlKey: true, metaKey: false, altKey: false })).toBe(
      false,
    );
    expect(shouldDeferShortcutToTextEntryWhen(true, { ctrlKey: false, metaKey: true, altKey: false })).toBe(
      false,
    );
    expect(shouldDeferShortcutToTextEntryWhen(true, { ctrlKey: false, metaKey: false, altKey: true })).toBe(
      false,
    );
  });

  it("does not defer when focus is not on a text entry element", () => {
    expect(
      shouldDeferShortcutToTextEntryWhen(false, { ctrlKey: false, metaKey: false, altKey: false }),
    ).toBe(false);
  });
});
