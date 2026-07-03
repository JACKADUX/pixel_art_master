import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import type { AppComponent } from "@/domain/comfyApp/ComfyAppComponent";
import {
  useComfyAppStore,
  type ImageRunnerValue,
} from "@/presentation/stores/comfyAppStore";
import { useComfyAppRunnerScope } from "../ComfyAppRunnerScopeContext";

export function ImageUploadField({
  component,
  value,
  disabled,
}: {
  component: AppComponent;
  value: ImageRunnerValue;
  disabled: boolean;
}) {
  const scope = useComfyAppRunnerScope();
  const uploadRunnerImage = useComfyAppStore((s) => s.uploadRunnerImage);
  const [busy, setBusy] = useState(false);

  const handlePick = async () => {
    if (disabled || busy) return;
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "图片", extensions: ["png", "jpg", "jpeg", "webp", "bmp", "gif"] }],
    });
    if (!selected || typeof selected !== "string") return;

    setBusy(true);
    try {
      const bytes = await readFile(selected);
      const previewUrl = URL.createObjectURL(new Blob([bytes as BlobPart]));
      const filename = selected.split(/[\\/]/).pop() ?? "image.png";
      await uploadRunnerImage(scope, component.id, bytes, filename, previewUrl);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {value.previewUrl ? (
        <div className="overflow-hidden rounded border border-zinc-700 bg-zinc-950">
          <img
            src={value.previewUrl}
            alt={value.filename}
            className="max-h-48 w-full object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded border border-dashed border-zinc-700 bg-zinc-900 text-[11px] text-zinc-600">
          未选择图片
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-zinc-500" title={value.filename}>
          {value.filename || "（未上传）"}
        </span>
        <button
          type="button"
          onClick={() => void handlePick()}
          disabled={disabled || busy}
          className="shrink-0 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "上传中…" : "选择图片"}
        </button>
      </div>
    </div>
  );
}
