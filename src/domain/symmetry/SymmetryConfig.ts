export interface SymmetryConfig {
  /** Mirror left-right across a vertical axis at originX. */
  horizontal: boolean;
  /** Mirror top-bottom across a horizontal axis at originY. */
  vertical: boolean;
  /** Vertical axis position; supports half-pixel values. */
  originX: number;
  /** Horizontal axis position; supports half-pixel values. */
  originY: number;
}

export interface SymmetryOrigin {
  originX: number;
  originY: number;
}

export function createCenteredOrigin(width: number, height: number): SymmetryOrigin {
  return {
    originX: width / 2,
    originY: height / 2,
  };
}

export function createDefaultSymmetryConfig(width = 0, height = 0): SymmetryConfig {
  const origin = createCenteredOrigin(Math.max(width, 1), Math.max(height, 1));
  return {
    horizontal: false,
    vertical: false,
    originX: origin.originX,
    originY: origin.originY,
  };
}

export function isSymmetryActive(config: SymmetryConfig): boolean {
  return config.horizontal || config.vertical;
}
