import { describe, expect, it } from "vitest";

import { isDrawingLayer, isReferenceLayer } from "@/domain/layer/LayerTypeGuards";

import { createEmptyProject, isUnsavedEmptyProject } from "./Project";

describe("createEmptyProject", () => {
  it("creates only a drawing layer with no default reference layer", () => {
    const project = createEmptyProject("blank");

    expect(project.canvas.layers).toHaveLength(1);
    expect(isDrawingLayer(project.canvas.layers[0]!)).toBe(true);
    expect(project.canvas.layers.some((layer) => isReferenceLayer(layer))).toBe(false);
    expect(project.canvas.activeReferenceLayerId).toBeNull();
  });

  it("is considered an unsaved empty project", () => {
    const project = createEmptyProject("blank");

    expect(isUnsavedEmptyProject(project)).toBe(true);
  });
});
