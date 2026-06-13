const TEXT_INPUT_TYPES = new Set([
  "text",
  "number",
  "search",
  "password",
  "email",
  "url",
  "tel",
  "",
]);

export function isTextInputType(type: string): boolean {
  return TEXT_INPUT_TYPES.has(type.toLowerCase());
}

export function isTextEntryElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable) return true;

  const tag = element.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;

  return isTextInputType((element as HTMLInputElement).type);
}

/** Blur any focused control so canvas/global shortcuts work after clicking the canvas. */
export function releaseKeyboardFocus(): void {
  const active = document.activeElement;
  if (
    active instanceof HTMLElement &&
    active !== document.body &&
    active !== document.documentElement
  ) {
    active.blur();
  }
}

/** Blur text inputs when clicking elsewhere so global shortcuts keep working. */
export function installGlobalFocusRelease(): () => void {
  const handlePointerDown = (event: PointerEvent) => {
    if (isTextEntryElement(event.target as Element)) return;
    releaseKeyboardFocus();
  };

  document.addEventListener("pointerdown", handlePointerDown, true);
  return () => document.removeEventListener("pointerdown", handlePointerDown, true);
}
