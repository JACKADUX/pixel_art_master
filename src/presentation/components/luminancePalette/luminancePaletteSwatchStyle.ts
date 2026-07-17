export function buildLuminanceSwatchBackground(hex: string): string {
  return `
    linear-gradient(${hex}, ${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

export const LUMINANCE_SWATCH_SIZE_PX = 16;
export const LUMINANCE_SWATCH_GAP_PX = 4;
