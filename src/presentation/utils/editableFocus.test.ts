import { describe, expect, it } from "vitest";
import { shouldDeferShortcutToTextEntryWhen } from "@/presentation/utils/editableFocus";

describe("shouldDeferShortcutToTextEntryWhen", () => {
  it("defers unmodified keys when a text input is focused", () => {
    expect(
      shouldDeferShortcutToTextEntryWhen(true, {
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        key: "a",
      }),
    ).toBe(true);
  });

  it("defers standard text editing modifier shortcuts when a text input is focused", () => {
    expect(
      shouldDeferShortcutToTextEntryWhen(true, {
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        key: "c",
      }),
    ).toBe(true);
    expect(
      shouldDeferShortcutToTextEntryWhen(true, {
        ctrlKey: false,
        metaKey: true,
        altKey: false,
        shiftKey: false,
        key: "v",
      }),
    ).toBe(true);
    expect(
      shouldDeferShortcutToTextEntryWhen(true, {
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: true,
        key: "z",
      }),
    ).toBe(true);
  });

  it("defers alt combinations when a text input is focused", () => {
    expect(
      shouldDeferShortcutToTextEntryWhen(true, {
        ctrlKey: false,
        metaKey: false,
        altKey: true,
        shiftKey: false,
        key: "a",
      }),
    ).toBe(true);
  });

  it("keeps app-global save/new/open shortcuts when a text input is focused", () => {
    expect(
      shouldDeferShortcutToTextEntryWhen(true, {
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        key: "s",
      }),
    ).toBe(false);
    expect(
      shouldDeferShortcutToTextEntryWhen(true, {
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        key: "n",
      }),
    ).toBe(false);
    expect(
      shouldDeferShortcutToTextEntryWhen(true, {
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        key: "o",
      }),
    ).toBe(false);
  });

  it("does not defer when focus is not on a text entry element", () => {
    expect(
      shouldDeferShortcutToTextEntryWhen(false, {
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        key: "a",
      }),
    ).toBe(false);
  });
});
