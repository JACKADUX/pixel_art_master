import type { IClipboardService } from "@/application/ports/IClipboardService";
import type { Project } from "@/domain/project/Project";
import {
  importImageDataToReferenceLayer,
  type ImportToReferenceLayerResult,
} from "./ImportToReferenceLayer";

export async function importReferenceLayerFromClipboard(
  clipboard: IClipboardService,
  project: Project,
): Promise<ImportToReferenceLayerResult | null> {
  const imageData = await clipboard.readImage();
  if (!imageData) return null;
  return importImageDataToReferenceLayer(
    project,
    imageData,
    `剪贴板 ${new Date().toLocaleString()}`,
  );
}
