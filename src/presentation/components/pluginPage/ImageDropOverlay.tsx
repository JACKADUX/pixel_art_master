interface ImageDropOverlayProps {
  visible: boolean;
  hint?: string;
}

export function ImageDropOverlay({ visible, hint = "松开以导入图片" }: ImageDropOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center border-2 border-dashed border-sky-400/60 bg-sky-500/10">
      <span className="rounded bg-zinc-900/90 px-4 py-2 text-sm text-sky-200">
        {hint}
      </span>
    </div>
  );
}
