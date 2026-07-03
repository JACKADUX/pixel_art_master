import { describe, expect, it } from "vitest";
import {
  bringPanelToFront,
  computeFloatingPanelZIndex,
  FLOATING_PANEL_Z_BASE,
  FLOATING_PANEL_Z_MAX,
  type FloatingPanelId,
} from "./FloatingPanelStack";

describe("FloatingPanelStack", () => {
  it("把窗口移到栈顶（末尾）", () => {
    const stack: FloatingPanelId[] = ["navigator", "colorPicker", "comfyRunner"];
    expect(bringPanelToFront(stack, "navigator")).toEqual([
      "colorPicker",
      "comfyRunner",
      "navigator",
    ]);
  });

  it("已在栈顶时顺序不变", () => {
    const stack: FloatingPanelId[] = ["navigator", "comfyRunner"];
    expect(bringPanelToFront(stack, "comfyRunner")).toEqual([
      "navigator",
      "comfyRunner",
    ]);
  });

  it("层级随栈顺序递增，最近激活者最高", () => {
    const stack: FloatingPanelId[] = ["navigator", "colorPicker", "comfyRunner"];
    expect(computeFloatingPanelZIndex(stack, "navigator")).toBe(FLOATING_PANEL_Z_BASE);
    expect(computeFloatingPanelZIndex(stack, "comfyRunner")).toBe(
      FLOATING_PANEL_Z_BASE + 2,
    );
  });

  it("层级不超过上限（保持在弹窗/模态之下）", () => {
    const stack = Array.from({ length: 40 }, (_, i) => `p${i}` as FloatingPanelId);
    stack.push("comfyRunner");
    expect(computeFloatingPanelZIndex(stack, "comfyRunner")).toBe(FLOATING_PANEL_Z_MAX);
  });

  it("不在栈中的窗口取基准层级", () => {
    expect(computeFloatingPanelZIndex([], "navigator")).toBe(FLOATING_PANEL_Z_BASE);
  });
});
