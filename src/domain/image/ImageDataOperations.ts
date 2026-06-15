export function cloneImageData(source: ImageData): ImageData {
  return {
    width: source.width,
    height: source.height,
    data: new Uint8ClampedArray(source.data),
    colorSpace: source.colorSpace,
  } as ImageData;
}
