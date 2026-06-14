import type { RestoreScale } from "./RestoreScale";
import type { GridRestoreConfig } from "./GridRestoreConfig";

export type RestoreMethod =
  | { type: "fixedScale"; scale: RestoreScale }
  | { type: "gridScale"; config: GridRestoreConfig };

export function fixedScaleMethod(scale: RestoreScale): RestoreMethod {
  return { type: "fixedScale", scale };
}

export function gridScaleMethod(config: GridRestoreConfig): RestoreMethod {
  return { type: "gridScale", config };
}
