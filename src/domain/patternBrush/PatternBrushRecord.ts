export interface PatternBrushRecord {
  id: string;
  title: string;
  imageFile: string;
  width: number;
  height: number;
  createdAt: string;
}

export function formatPatternBrushDefaultTitle(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `图案 ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function createPatternBrushRecord(
  imageFile: string,
  width: number,
  height: number,
  title?: string,
): PatternBrushRecord {
  return {
    id: crypto.randomUUID(),
    title: title ?? formatPatternBrushDefaultTitle(),
    imageFile,
    width,
    height,
    createdAt: new Date().toISOString(),
  };
}

export function updatePatternBrushTitle(
  record: PatternBrushRecord,
  title: string,
): PatternBrushRecord {
  const trimmed = title.trim();
  return trimmed ? { ...record, title: trimmed } : record;
}
