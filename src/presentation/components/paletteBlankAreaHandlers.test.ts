import { describe, expect, it, vi } from "vitest";
import { TRANSPARENT, rgba } from "@/domain/canvas/PixelColor";
import {
  handlePaletteBlankAreaClick,
  handlePaletteBlankAreaContextMenu,
  isPaletteSwatchClickTarget,
} from "./paletteBlankAreaHandlers";

function mockElement(options: { closestResult?: Element | null } = {}): HTMLElement {
  return {
    closest: () => options.closestResult ?? null,
  } as unknown as HTMLElement;
}

describe("paletteBlankAreaHandlers", () => {
  it("detects swatch button clicks", () => {
    const button = mockElement({ closestResult: mockElement() });
    expect(isPaletteSwatchClickTarget(button)).toBe(true);
  });

  it("sets transparent foreground on blank left click", () => {
    const onSelect = vi.fn();
    const container = mockElement();
    const event = {
      target: container,
      currentTarget: container,
    } as unknown as React.MouseEvent<HTMLElement>;

    handlePaletteBlankAreaClick(event, false, onSelect);

    expect(onSelect).toHaveBeenCalledWith("foreground", TRANSPARENT);
  });

  it("sets transparent background on blank right click", () => {
    const onSelect = vi.fn();
    const container = mockElement();
    const event = {
      target: container,
      currentTarget: container,
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<HTMLElement>;

    handlePaletteBlankAreaContextMenu(event, false, onSelect);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith("background", TRANSPARENT);
  });

  it("ignores blank clicks while removing colors", () => {
    const onSelect = vi.fn();
    const container = mockElement();
    const event = {
      target: container,
      currentTarget: container,
    } as unknown as React.MouseEvent<HTMLElement>;

    handlePaletteBlankAreaClick(event, true, onSelect);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("ignores clicks on palette swatches", () => {
    const onSelect = vi.fn();
    const button = mockElement({ closestResult: mockElement() });
    const event = {
      target: button,
      currentTarget: mockElement(),
    } as unknown as React.MouseEvent<HTMLElement>;

    handlePaletteBlankAreaClick(event, false, onSelect);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not overwrite swatch selection with transparent", () => {
    const onSelect = vi.fn();
    const button = mockElement({ closestResult: mockElement() });
    const event = {
      target: button,
      currentTarget: mockElement(),
    } as unknown as React.MouseEvent<HTMLElement>;

    handlePaletteBlankAreaClick(event, false, onSelect);
    onSelect.mockClear();
    onSelect("foreground", rgba(255, 0, 0));

    expect(onSelect).toHaveBeenCalledWith("foreground", rgba(255, 0, 0));
  });
});
