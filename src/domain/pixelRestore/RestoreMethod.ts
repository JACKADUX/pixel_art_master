import type { RestoreScale } from "./RestoreScale";

export type RestoreMethod = {
  type: "fixedScale";
  scale: RestoreScale;
};

export function fixedScaleMethod(scale: RestoreScale): RestoreMethod {
  return { type: "fixedScale", scale };
}
