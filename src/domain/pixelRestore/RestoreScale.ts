export const MIN_RESTORE_SCALE = 2;
export const MAX_RESTORE_SCALE = 16;

export interface RestoreScale {
  readonly value: number;
}

export function createRestoreScale(value: number): RestoreScale {
  if (
    !Number.isInteger(value) ||
    value < MIN_RESTORE_SCALE ||
    value > MAX_RESTORE_SCALE
  ) {
    throw new Error(
      `Restore scale must be an integer between ${MIN_RESTORE_SCALE} and ${MAX_RESTORE_SCALE}`,
    );
  }
  return { value };
}

export function tryCreateRestoreScale(value: number): RestoreScale | null {
  try {
    return createRestoreScale(value);
  } catch {
    return null;
  }
}
