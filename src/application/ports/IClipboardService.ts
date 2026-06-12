export interface IClipboardService {
  copyImage(pngBlob: Blob): Promise<void>;
  readImage(): Promise<ImageData | null>;
}
