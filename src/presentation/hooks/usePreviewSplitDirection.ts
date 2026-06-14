import { useEffect, useState, type RefObject } from "react";
import {
  resolvePreviewSplitDirection,
  type PreviewSplitDirection,
} from "@/domain/viewport/PreviewSplitLayout";

export function usePreviewSplitDirection(
  containerRef: RefObject<HTMLElement | null>,
): PreviewSplitDirection {
  const [direction, setDirection] = useState<PreviewSplitDirection>("vertical");

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = (width: number, height: number) => {
      setDirection(resolvePreviewSplitDirection(width, height));
    };

    update(element.clientWidth, element.clientHeight);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      update(entry.contentRect.width, entry.contentRect.height);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  return direction;
}
