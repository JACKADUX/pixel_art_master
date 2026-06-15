import { describe, expect, it } from "vitest";
import {
  decodeBase64ToRgba,
  encodeRgbaToBase64,
} from "@/infrastructure/image/RgbaBase64Codec";

describe("RgbaBase64Codec", () => {
  it("round-trips RGBA buffers", () => {
    const source = new Uint8ClampedArray([255, 128, 64, 255, 0, 0, 0, 0]);
    const encoded = encodeRgbaToBase64(source);
    const decoded = decodeBase64ToRgba(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(source));
  });
});
