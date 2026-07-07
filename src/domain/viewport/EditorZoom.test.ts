import { describe, expect, it } from "vitest";
import {
  applyEditorWheelZoomRatio,
  clampEditorZoom,
  editorZoomFromSlider,
  editorZoomToSlider,
  EDITOR_MIN_ZOOM,
} from "./EditorZoom";

describe("EditorZoom", () => {
  it("clamps zoom to editor range", () => {
    expect(clampEditorZoom(0.01)).toBe(EDITOR_MIN_ZOOM);
    expect(clampEditorZoom(64)).toBe(32);
    expect(clampEditorZoom(0.54)).toBe(0.54);
  });

  it("applies wheel ratio zoom", () => {
    expect(applyEditorWheelZoomRatio(1, -100)).toBeGreaterThan(1);
    expect(applyEditorWheelZoomRatio(1, 100)).toBeLessThan(1);
  });

  it("round-trips slider mapping", () => {
    const zoom = editorZoomFromSlider(0.5);
    expect(editorZoomToSlider(zoom)).toBeCloseTo(0.5, 5);
  });
});
