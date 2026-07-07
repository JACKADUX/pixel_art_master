import { describe, expect, it } from "vitest";
import { createEmptyProject } from "@/domain/project/Project";
import { TRANSPARENT, rgba } from "@/domain/canvas/PixelColor";
import {
  beginDrawingStroke,
  commitDrawingStroke,
} from "@/application/use-cases/DrawingStrokeSessionUseCases";
import { getActiveLayer } from "@/domain/project/Project";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";

describe("DrawingStrokeSessionUseCases", () => {
  it("begins and commits a stroke session", () => {
    const project = createEmptyProject("test", { width: 16, height: 16 });
    const session = beginDrawingStroke(project);
    expect(session).not.toBeNull();

    session!.surface.setPixel(2, 2, rgba(255, 0, 0, 255));

    const committed = commitDrawingStroke(project, session!);
    const layer = getActiveLayer(committed);
    expect(isDrawingLayer(layer)).toBe(true);
    if (!isDrawingLayer(layer)) return;

    expect(layer.pixels[2 * layer.width + 2]).not.toBe(TRANSPARENT);
  });
});
