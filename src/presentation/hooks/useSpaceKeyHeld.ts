import { useEffect, useRef, type RefObject } from "react";

/** 跟踪 Space 键是否按下；供 pointer 事件读取 modifier 状态。 */
export function useSpaceKeyHeldRef(): RefObject<boolean> {
  const spaceKeyHeldRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        spaceKeyHeldRef.current = true;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        spaceKeyHeldRef.current = false;
      }
    };

    const reset = () => {
      spaceKeyHeldRef.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", reset);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", reset);
    };
  }, []);

  return spaceKeyHeldRef;
}
