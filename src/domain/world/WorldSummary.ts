export interface WorldSummary {
  filePath: string;
  id: string;
  name: string;
  worldview: string;
  entityCount: number;
  updatedAt: string;
}

export function compareByUpdatedAtDesc(a: WorldSummary, b: WorldSummary): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}
