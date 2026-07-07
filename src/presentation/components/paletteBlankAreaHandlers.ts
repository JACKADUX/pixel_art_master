import { TRANSPARENT, type PixelColor } from "@/domain/canvas/PixelColor";
import type { MouseEvent } from "react";
import type { ColorSlot } from "../stores/appStore";

export function isPaletteSwatchClickTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") return false;
  const element = target as { closest?: (selector: string) => Element | null };
  return typeof element.closest === "function" && element.closest("button") !== null;
}

export function handlePaletteBlankAreaClick(
  event: MouseEvent<HTMLElement>,
  removeMode: boolean,
  onSelect: (slot: ColorSlot, color: PixelColor) => void,
): void {
  if (removeMode || isPaletteSwatchClickTarget(event.target)) return;
  onSelect("foreground", TRANSPARENT);
}

export function handlePaletteBlankAreaContextMenu(
  event: MouseEvent<HTMLElement>,
  removeMode: boolean,
  onSelect: (slot: ColorSlot, color: PixelColor) => void,
): void {
  event.preventDefault();
  if (removeMode || isPaletteSwatchClickTarget(event.target)) return;
  onSelect("background", TRANSPARENT);
}

export const PALETTE_BLANK_AREA_TOOLTIP =
  "左键设为透明前景色，右键设为透明背景色";
