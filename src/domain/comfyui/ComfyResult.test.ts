import { describe, expect, it } from "vitest";
import { collectResultImages, mergeImageRefs, type ComfyImageRef } from "./ComfyResult";

function ref(filename: string, nodeId: string, type = "output"): ComfyImageRef {
  return { filename, subfolder: "", type, nodeId };
}

const history = {
  p1: {
    outputs: {
      "4": { images: [{ filename: "save.png", subfolder: "", type: "output" }] },
      "5": { images: [{ filename: "preview.png", subfolder: "", type: "temp" }] },
    },
  },
};

describe("collectResultImages", () => {
  it("不传白名单时收集全部并标记来源节点", () => {
    const refs = collectResultImages(history, "p1");
    expect(refs).toHaveLength(2);
    expect(refs.map((r) => r.nodeId).sort()).toEqual(["4", "5"]);
    expect(refs.find((r) => r.filename === "save.png")?.nodeId).toBe("4");
  });

  it("白名单仅保留指定节点的结果图", () => {
    const refs = collectResultImages(history, "p1", ["4"]);
    expect(refs).toHaveLength(1);
    expect(refs[0]?.filename).toBe("save.png");
  });

  it("空白名单数组表示不收集任何图", () => {
    const refs = collectResultImages(history, "p1", []);
    expect(refs).toHaveLength(0);
  });

  it("promptId 不存在时返回空", () => {
    expect(collectResultImages(history, "nope")).toEqual([]);
  });
});

describe("mergeImageRefs", () => {
  it("合并多来源并按文件去重", () => {
    const historyRefs = [ref("save.png", "4")];
    const executedRefs = [ref("save.png", "4"), ref("preview.png", "6", "temp")];
    const merged = mergeImageRefs([historyRefs, executedRefs]);
    expect(merged.map((r) => r.filename)).toEqual(["save.png", "preview.png"]);
  });

  it("收集 history 缺失但 executed 提供的预览节点图", () => {
    const historyRefs = [ref("save.png", "4")];
    const executedRefs = [ref("preview.png", "6", "temp")];
    const merged = mergeImageRefs([historyRefs, executedRefs], ["4", "6"]);
    expect(merged.map((r) => r.nodeId).sort()).toEqual(["4", "6"]);
  });

  it("按白名单过滤未勾选节点", () => {
    const merged = mergeImageRefs(
      [[ref("a.png", "4")], [ref("b.png", "6", "temp")]],
      ["6"],
    );
    expect(merged.map((r) => r.filename)).toEqual(["b.png"]);
  });
});
