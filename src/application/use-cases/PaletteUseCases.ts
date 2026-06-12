import type { PixelColor } from "@/domain/canvas/PixelColor";
import { touchProject, type Project } from "@/domain/project/Project";

export function addColorToPalette(project: Project, color: PixelColor): Project {
  return touchProject({
    ...project,
    palette: project.palette.withAddedColor(color),
  });
}

export function removeColorsFromPalette(project: Project, hexes: string[]): Project {
  if (hexes.length === 0) return project;
  return touchProject({
    ...project,
    palette: project.palette.withRemovedColors(hexes),
  });
}
