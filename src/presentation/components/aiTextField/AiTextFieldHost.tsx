import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useAiTextFieldSessionStore } from "../../stores/aiTextFieldSessionStore";
import { AiTextFieldPopover } from "./AiTextFieldPopover";

export function AiTextFieldHost() {
  const init = useAiTextFieldSessionStore((s) => s.init);
  const isOpen = useAiTextFieldSessionStore((s) => s.isOpen);

  useEffect(() => {
    init();
  }, [init]);

  if (!isOpen) return null;

  return createPortal(<AiTextFieldPopover />, document.body);
}
