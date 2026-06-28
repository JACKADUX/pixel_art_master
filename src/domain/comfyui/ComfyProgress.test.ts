import { describe, expect, it } from "vitest";
import {
  initialRunProgress,
  parseComfyWsMessage,
  reduceProgress,
} from "./ComfyProgress";

describe("parseComfyWsMessage", () => {
  it("解析 status 消息", () => {
    const event = parseComfyWsMessage(
      JSON.stringify({ type: "status", data: { status: { exec_info: { queue_remaining: 2 } } } }),
    );
    expect(event).toEqual({ kind: "status", queueRemaining: 2 });
  });

  it("解析 progress 消息", () => {
    const event = parseComfyWsMessage({
      type: "progress",
      data: { value: 5, max: 20, node: "3" },
    });
    expect(event).toEqual({ kind: "progress", node: "3", value: 5, max: 20 });
  });

  it("解析 executing 完成（node 为 null）", () => {
    const event = parseComfyWsMessage({
      type: "executing",
      data: { node: null, prompt_id: "p1" },
    });
    expect(event).toEqual({ kind: "executing", promptId: "p1", node: null });
  });

  it("解析 executed 中的图像", () => {
    const event = parseComfyWsMessage({
      type: "executed",
      data: {
        node: "9",
        prompt_id: "p1",
        output: { images: [{ filename: "a.png", subfolder: "", type: "output" }] },
      },
    });
    expect(event).toMatchObject({
      kind: "executed",
      images: [{ filename: "a.png", subfolder: "", type: "output" }],
    });
  });

  it("未知类型或非法 JSON 返回 null", () => {
    expect(parseComfyWsMessage("{not json")).toBeNull();
    expect(parseComfyWsMessage({ type: "unknown" })).toBeNull();
  });
});

describe("reduceProgress", () => {
  it("progress 事件计算百分比", () => {
    const next = reduceProgress(initialRunProgress, {
      kind: "progress",
      node: "3",
      value: 10,
      max: 20,
    });
    expect(next.percent).toBe(50);
    expect(next.status).toBe("running");
    expect(next.currentNode).toBe("3");
  });

  it("error 事件切换为错误状态", () => {
    const next = reduceProgress(initialRunProgress, {
      kind: "error",
      message: "boom",
    });
    expect(next.status).toBe("error");
  });

  it("max 为 0 时百分比为 0", () => {
    const next = reduceProgress(initialRunProgress, {
      kind: "progress",
      node: null,
      value: 3,
      max: 0,
    });
    expect(next.percent).toBe(0);
  });
});
