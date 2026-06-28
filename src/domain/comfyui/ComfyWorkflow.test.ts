import { describe, expect, it } from "vitest";
import { ComfyError } from "./ComfyError";
import {
  getNodeTitle,
  looksLikeNodeMap,
  parseComfyApiWorkflow,
  type ComfyApiWorkflow,
} from "./ComfyWorkflow";

const sampleWorkflow: ComfyApiWorkflow = {
  "3": {
    class_type: "KSampler",
    inputs: {
      seed: 123,
      steps: 20,
      model: ["4", 0],
    },
  },
  "4": {
    class_type: "CheckpointLoaderSimple",
    inputs: { ckpt_name: "sd_xl.safetensors" },
    _meta: { title: "加载模型" },
  },
};

describe("ComfyWorkflow", () => {
  it("识别合法的 API 格式节点表", () => {
    expect(looksLikeNodeMap(sampleWorkflow)).toBe(true);
  });

  it("拒绝空对象与数组", () => {
    expect(looksLikeNodeMap({})).toBe(false);
    expect(looksLikeNodeMap([])).toBe(false);
    expect(looksLikeNodeMap(null)).toBe(false);
  });

  it("直接解析节点表", () => {
    expect(parseComfyApiWorkflow(sampleWorkflow)).toBe(sampleWorkflow);
  });

  it("解析被 prompt 包裹的工作流", () => {
    const wrapped = { prompt: sampleWorkflow, client_id: "x" };
    expect(parseComfyApiWorkflow(wrapped)).toBe(sampleWorkflow);
  });

  it("非法格式抛出解析错误", () => {
    expect(() => parseComfyApiWorkflow({ a: 1 })).toThrow(ComfyError);
    expect(() => parseComfyApiWorkflow(null)).toThrow(ComfyError);
  });

  it("节点标题优先取 _meta.title", () => {
    expect(getNodeTitle(sampleWorkflow["4"])).toBe("加载模型");
    expect(getNodeTitle(sampleWorkflow["3"])).toBe("KSampler");
  });
});
