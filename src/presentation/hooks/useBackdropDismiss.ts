import { useRef, type MouseEvent } from "react";

/**
 * 「点击遮罩关闭」事件属性。仅当指针在遮罩自身按下并在遮罩自身抬起时触发关闭，
 * 避免从弹窗内部拖拽到外部（如文本选择）松手时误触关闭。
 *
 * 用法：在遮罩 div 上展开 `{...useBackdropDismiss(onClose)}`，内容区无需再 stopPropagation。
 */
export function useBackdropDismiss<T extends HTMLElement = HTMLElement>(
  onDismiss: () => void,
  enabled = true,
) {
  const downOnSelf = useRef(false);
  return {
    onMouseDown: (e: MouseEvent<T>) => {
      downOnSelf.current = e.target === e.currentTarget;
    },
    onMouseUp: (e: MouseEvent<T>) => {
      const ok = enabled && downOnSelf.current && e.target === e.currentTarget;
      downOnSelf.current = false;
      if (ok) onDismiss();
    },
  };
}
