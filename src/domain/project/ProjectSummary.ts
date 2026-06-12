export interface ProjectSummary {
  filePath: string;
  id: string;
  name: string;
  updatedAt: string;
  width: number;
  height: number;
}

export function compareByUpdatedAtDesc(a: ProjectSummary, b: ProjectSummary): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}
