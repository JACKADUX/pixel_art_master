import { useEffect, useState } from "react";

export function useAltKeyHeld(): boolean {
  const [altHeld, setAltHeld] = useState(false);

  useEffect(() => {
    const syncFromKeyboard = (event: KeyboardEvent) => {
      setAltHeld(event.altKey);
      // 单独按下/松开 Alt 时阻止浏览器默认行为，作为非 WebView2 环境下的兜底。
      if (event.key === "Alt") {
        event.preventDefault();
      }
    };

    // 在 Windows/WebView2 上，单独的 Alt 键事件会被原生层拦截（阻止系统菜单抢占焦点），
    // 因此不会到达网页。这里额外从鼠标事件读取 Alt 状态，保证取色器光标依然能正确显示与还原。
    const syncFromMouse = (event: MouseEvent) => {
      setAltHeld(event.altKey);
    };

    const resetAltState = () => {
      setAltHeld(false);
    };

    window.addEventListener("keydown", syncFromKeyboard);
    window.addEventListener("keyup", syncFromKeyboard);
    window.addEventListener("mousemove", syncFromMouse);
    window.addEventListener("mousedown", syncFromMouse);
    window.addEventListener("blur", resetAltState);

    return () => {
      window.removeEventListener("keydown", syncFromKeyboard);
      window.removeEventListener("keyup", syncFromKeyboard);
      window.removeEventListener("mousemove", syncFromMouse);
      window.removeEventListener("mousedown", syncFromMouse);
      window.removeEventListener("blur", resetAltState);
    };
  }, []);

  return altHeld;
}
