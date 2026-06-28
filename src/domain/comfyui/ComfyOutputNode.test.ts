import { describe, expect, it } from "vitest";
import {
  collectWorkflowClassTypes,
  getExportableNodeIds,
  isExportableClassType,
  listWorkflowNodes,
  normalizeOutputClassTypes,
} from "./ComfyOutputNode";
import type { ComfyApiWorkflow } from "./ComfyWorkflow";

const workflow: ComfyApiWorkflow = {
  "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "x.safetensors" } },
  "2": { class_type: "KSampler", inputs: { model: ["1", 0], seed: 1 } },
  "3": { class_type: "VAEDecode", inputs: { samples: ["2", 0] } },
  "4": { class_type: "SaveImage", inputs: { images: ["3", 0] }, _meta: { title: "最终输出" } },
  "5": { class_type: "PreviewImage", inputs: { images: ["3", 0] } },
};

describe("normalizeOutputClassTypes", () => {
  it("去重去空白并保持顺序", () => {
    expect(normalizeOutputClassTypes([" SaveImage ", "SaveImage", "", "PreviewImage"])).toEqual([
      "SaveImage",
      "PreviewImage",
    ]);
  });
});

describe("listWorkflowNodes", () => {
  it("列出全部节点并按数字 id 升序，使用 _meta.title", () => {
    const nodes = listWorkflowNodes(workflow);
    expect(nodes.map((n) => n.nodeId)).toEqual(["1", "2", "3", "4", "5"]);
    expect(nodes.find((n) => n.nodeId === "4")?.nodeTitle).toBe("最终输出");
  });
});

describe("collectWorkflowClassTypes", () => {
  it("去重并排序", () => {
    expect(collectWorkflowClassTypes(workflow)).toEqual([
      "CheckpointLoaderSimple",
      "KSampler",
      "PreviewImage",
      "SaveImage",
      "VAEDecode",
    ]);
  });
});

describe("getExportableNodeIds / isExportableClassType", () => {
  it("按白名单取出可导出节点 id", () => {
    expect(getExportableNodeIds(workflow, ["SaveImage", "PreviewImage"]).sort()).toEqual([
      "4",
      "5",
    ]);
  });

  it("白名单仅含 SaveImage 时只取该类节点", () => {
    expect(getExportableNodeIds(workflow, ["SaveImage"])).toEqual(["4"]);
  });

  it("判断单个类型是否可导出", () => {
    expect(isExportableClassType("SaveImage", ["SaveImage"])).toBe(true);
    expect(isExportableClassType("KSampler", ["SaveImage"])).toBe(false);
  });
});
