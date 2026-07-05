import { describe, expect, it } from "vitest";
import {
  applyStructureSnapshot,
  captureStructureSnapshot,
  pushStructureHistory,
  undoHistory,
} from "./HistoryUseCases";
import { HistoryStack } from "@/domain/history/HistoryStack";
import { createEmptyProject } from "@/domain/project/Project";
import { resizeProjectCanvas } from "@/domain/project/Project";

describe("HistoryUseCases canvas resize", () => {
  it("undoes canvas edge resize by restoring dimensions and layer pixels", () => {
    const project = createEmptyProject("test", { width: 64, height: 64 });
    const historyStack = new HistoryStack();

    pushStructureHistory(historyStack, project, null);
    const resized = resizeProjectCanvas(project, 96, 64);

    const result = undoHistory(historyStack, resized, null);
    expect(result).not.toBeNull();
    expect(result!.structural).toBe(true);
    expect(result!.project.canvas.width).toBe(64);
    expect(result!.project.canvas.height).toBe(64);
    expect(result!.project.canvas.layers[0].type).toBe("drawing");
    if (result!.project.canvas.layers[0].type === "drawing") {
      expect(result!.project.canvas.layers[0].pixels.length).toBe(64 * 64);
    }
  });

  it("applyStructureSnapshot restores canvas dimensions from snapshot", () => {
    const project = createEmptyProject("test", { width: 32, height: 32 });
    const snapshot = captureStructureSnapshot(project, null);
    if (snapshot.kind !== "structure") {
      throw new Error("expected structure snapshot");
    }
    const resized = resizeProjectCanvas(project, 64, 64);
    const restored = applyStructureSnapshot(resized, snapshot);

    expect(restored.canvas.width).toBe(32);
    expect(restored.canvas.height).toBe(32);
  });
});
