/**
 * 界面主区域的「激活态」领域模型。
 *
 * 用户同一时刻只能激活一个主区域（画布编辑器、资产库、色板、图层区），
 * 激活态用于视觉聚焦指示，并为后续按区域生效的快捷键提供依据。
 */
export type WorkspaceRegion = "canvas" | "assetLibrary" | "palette" | "layers";

export const WORKSPACE_REGIONS: readonly WorkspaceRegion[] = [
  "canvas",
  "assetLibrary",
  "palette",
  "layers",
];

export function isWorkspaceRegion(value: unknown): value is WorkspaceRegion {
  return (
    typeof value === "string" &&
    (WORKSPACE_REGIONS as readonly string[]).includes(value)
  );
}

/**
 * 互斥激活的纯 reducer：点击某区域即把它设为唯一激活区域；
 * 传入 `null` 表示点击发生在所有区域之外，清除激活态。
 */
export function resolveActiveRegion(
  _current: WorkspaceRegion | null,
  clicked: WorkspaceRegion | null,
): WorkspaceRegion | null {
  return clicked;
}
