import { resizeProjectCanvas, type Project } from "@/domain/project/Project";

export function resizeCanvas(
  project: Project,
  width: number,
  height: number,
): Project {
  return resizeProjectCanvas(project, width, height);
}
