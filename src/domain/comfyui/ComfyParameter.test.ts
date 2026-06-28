import { describe, expect, it } from "vitest";
import {
  applyParameterOverrides,
  extractEditableParameters,
  setParameterValue,
} from "./ComfyParameter";
import type { ComfyApiWorkflow } from "./ComfyWorkflow";

const workflow: ComfyApiWorkflow = {
  "3": {
    class_type: "KSampler",
    inputs: {
      seed: 123,
      steps: 20,
      denoise: 1,
      add_noise: true,
      model: ["4", 0],
      positive: ["6", 0],
    },
  },
  "6": {
    class_type: "CLIPTextEncode",
    inputs: { text: "a cat", clip: ["4", 1] },
    _meta: { title: "正向提示词" },
  },
};

describe("ComfyParameter", () => {
  it("抽取所有基础标量输入，排除连线引用", () => {
    const params = extractEditableParameters(workflow);
    const ids = params.map((p) => p.id);
    expect(ids).toContain("3:seed");
    expect(ids).toContain("3:steps");
    expect(ids).toContain("3:add_noise");
    expect(ids).toContain("6:text");
    expect(ids).not.toContain("3:model");
    expect(ids).not.toContain("6:clip");
  });

  it("正确标注参数类型与标题", () => {
    const params = extractEditableParameters(workflow);
    const text = params.find((p) => p.id === "6:text");
    expect(text?.type).toBe("string");
    expect(text?.nodeTitle).toBe("正向提示词");
    const noise = params.find((p) => p.id === "3:add_noise");
    expect(noise?.type).toBe("boolean");
  });

  it("回填参数到工作流副本而不改原对象", () => {
    const params = extractEditableParameters(workflow);
    const updated = setParameterValue(params, "6:text", "a dog");
    const next = applyParameterOverrides(workflow, updated);
    expect(next["6"].inputs.text).toBe("a dog");
    expect(workflow["6"].inputs.text).toBe("a cat");
    expect(next["3"].inputs.model).toEqual(["4", 0]);
  });

  it("忽略不存在的节点或输入", () => {
    const next = applyParameterOverrides(workflow, [
      {
        id: "99:foo",
        nodeId: "99",
        classType: "X",
        nodeTitle: "X",
        inputKey: "foo",
        type: "string",
        value: "bar",
      },
    ]);
    expect(next["99"]).toBeUndefined();
  });
});
