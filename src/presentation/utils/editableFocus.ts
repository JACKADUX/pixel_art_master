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

/**
 * When a text input is focused, defer unmodified shortcuts so typed keys reach the field.
 * Modifier combos (Ctrl/Cmd/Alt) are always handled by the app shortcut layer.
 */
export function shouldDeferShortcutToTextEntryWhen(
  isTextEntry: boolean,
  event: Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "altKey">,
): boolean {
  if (!isTextEntry) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  return true;
}

export function shouldDeferShortcutToTextEntry(event: KeyboardEvent): boolean {
  return shouldDeferShortcutToTextEntryWhen(
    isTextEntryElement(document.activeElement),
    event,
  );
}

/** Blur text inputs when clicking elsewhere so global shortcuts keep working. */
export function installGlobalFocusRelease(onAfterRelease?: () => void): () => void {
  const handlePointerDown = (event: PointerEvent) => {
    if (isTextEntryElement(event.target as Element)) return;
    releaseKeyboardFocus();
    onAfterRelease?.();
  };

  document.addEventListener("pointerdown", handlePointerDown, true);
  return () => document.removeEventListener("pointerdown", handlePointerDown, true);
}
