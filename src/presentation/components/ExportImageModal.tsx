import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  computeExportDimensions,
  resolveExportPixelGrid,
} from "@/domain/export/ExportImageOperations";
import {
  MAX_CUSTOM_LONGEST_EDGE,
  MIN_CUSTOM_LONGEST_EDGE,
  type ImageExportFormat,
  type ImageExportScalePreset,
  type ImageExportScope,
} from "@/domain/export/ImageExportPreferences";
import { isSelectionEmpty } from "@/domain/selection/SelectionState";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { useBackdropDismiss } from "@/presentation/hooks/useBackdropDismiss";
import { useAppStore } from "../stores/appStore";
import { SettingsPathField } from "./settings/SettingsField";

const inputClassName =
  "h-8 w-full rounded border border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-100 outline-none transition focus:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/60";

const selectClassName =
  "h-8 w-full rounded border border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-100 outline-none transition focus:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/60";

const SCALE_OPTIONS: { value: ImageExportScalePreset; label: string }[] = [
  { value: "original", label: "当前尺寸" },
  { value: "256", label: "256 px（最长边）" },
  { value: "512", label: "512 px（最长边）" },
  { value: "1024", label: "1024 px（最长边）" },
  { value: "custom", label: "任意" },
];

const SCOPE_OPTIONS: { value: ImageExportScope; label: string }[] = [
  { value: "project", label: "当前项目" },
  { value: "layer", label: "当前图层" },
  { value: "selection", label: "当前选区" },
];

export function ExportImageModal() {
  const open = useAppStore((s) => s.exportImageModalOpen);
  const project = useAppStore((s) => s.project);
  const selection = useAppStore((s) => s.selection);
  const preferences = useAppStore((s) => s.imageExportPreferences);
  const projectsWorkspacePath = useAppStore((s) => s.projectsWorkspacePath);
  const closeExportImageModal = useAppStore((s) => s.closeExportImageModal);
  const pickExportDirectory = useAppStore((s) => s.pickExportDirectory);
  const executeExportImage = useAppStore((s) => s.executeExportImage);

  const [directory, setDirectory] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [format, setFormat] = useState<ImageExportFormat>("png");
  const [scope, setScope] = useState<ImageExportScope>("project");
  const [scalePreset, setScalePreset] = useState<ImageExportScalePreset>("original");
  const [customLongestEdge, setCustomLongestEdge] = useState(256);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const backdropProps = useBackdropDismiss<HTMLDivElement>(closeExportImageModal, !exporting);

  const hasSelection = selection !== null && !isSelectionEmpty(selection);

  useEffect(() => {
    if (!open || !project) return;
    setDirectory(
      preferences.lastExportDirectory ?? projectsWorkspacePath ?? null,
    );
    setFileName(project.name);
    setFormat(preferences.format);
    setScope(
      preferences.scope === "selection" && !hasSelection
        ? "project"
        : preferences.scope,
    );
    setScalePreset(preferences.scalePreset);
    setCustomLongestEdge(preferences.customLongestEdge);
    setError(null);
    setExporting(false);
  }, [open, project, preferences, projectsWorkspacePath, hasSelection]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !exporting) closeExportImageModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, exporting, closeExportImageModal]);

  const previewDimensions = useMemo(() => {
    if (!project) return null;
    const effectiveScope =
      scope === "selection" && !hasSelection ? "project" : scope;
    const grid = resolveExportPixelGrid(project, effectiveScope, selection);
    if (!grid) return null;
    return computeExportDimensions(grid, scalePreset, customLongestEdge);
  }, [project, scope, hasSelection, selection, scalePreset, customLongestEdge]);

  if (!open || !project) return null;

  const handlePickDirectory = async () => {
    const picked = await pickExportDirectory();
    if (picked) {
      setDirectory(picked);
      setError(null);
    }
  };

  const handleExport = async () => {
    if (!directory) {
      setError("请选择导出目录");
      return;
    }
    if (!fileName.trim()) {
      setError("请输入导出名称");
      return;
    }
    if (scope === "selection" && !hasSelection) {
      setError("当前没有选区，无法导出选区");
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const result = await executeExportImage({
        directory,
        fileName,
        format,
        scope,
        scalePreset,
        customLongestEdge,
      });
      if (result) {
        closeExportImageModal();
      } else {
        setError("导出失败，请检查选区或内容是否为空");
      }
    } finally {
      setExporting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
      {...backdropProps}
    >
      <div className="w-[28rem] max-w-[92vw] rounded-lg border border-zinc-600 bg-zinc-900 p-5 shadow-xl">
        <h3 className="mb-1 text-sm font-semibold text-zinc-100">导出为图片</h3>
        <p className="mb-4 text-xs text-zinc-500">
          将像素画导出为 PNG 或 WebP 文件，支持按最长边放大。
        </p>

        <div className="mb-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">导出目录</span>
            <SettingsPathField
              path={directory}
              emptyLabel="请选择导出目录"
              buttonLabel="浏览…"
              onPick={() => void handlePickDirectory()}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">导出名称</span>
            <input
              type="text"
              value={fileName}
              onChange={(e) => {
                setFileName(e.target.value);
                setError(null);
              }}
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">导出格式</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ImageExportFormat)}
              className={selectClassName}
            >
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs text-zinc-400">导出范围</legend>
            {SCOPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-2 text-xs ${
                  option.value === "selection" && !hasSelection
                    ? "cursor-not-allowed text-zinc-600"
                    : "cursor-pointer text-zinc-300"
                }`}
              >
                <input
                  type="radio"
                  name="export-scope"
                  value={option.value}
                  checked={scope === option.value}
                  disabled={option.value === "selection" && !hasSelection}
                  onChange={() => setScope(option.value)}
                  className="accent-blue-500"
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs text-zinc-400">导出前放大（最长边）</legend>
            {SCALE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300"
              >
                <input
                  type="radio"
                  name="export-scale"
                  value={option.value}
                  checked={scalePreset === option.value}
                  onChange={() => setScalePreset(option.value)}
                  className="accent-blue-500"
                />
                {option.label}
              </label>
            ))}
            {scalePreset === "custom" && (
              <div className="ml-5 flex items-center gap-2">
                <input
                  type="number"
                  min={MIN_CUSTOM_LONGEST_EDGE}
                  max={MAX_CUSTOM_LONGEST_EDGE}
                  value={customLongestEdge}
                  onChange={(e) =>
                    setCustomLongestEdge(Number(e.target.value))
                  }
                  className={`${inputClassName} max-w-[8rem]`}
                />
                <span className="text-[11px] text-zinc-500">px</span>
              </div>
            )}
          </fieldset>
        </div>

        {previewDimensions && (
          <p className="mb-3 text-[11px] text-zinc-500">
            导出尺寸：
            {previewDimensions.sourceWidth}×{previewDimensions.sourceHeight}
            {previewDimensions.outputWidth !== previewDimensions.sourceWidth ||
            previewDimensions.outputHeight !== previewDimensions.sourceHeight
              ? ` → ${previewDimensions.outputWidth}×${previewDimensions.outputHeight}`
              : ""}
          </p>
        )}

        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={exporting}
            onClick={closeExportImageModal}
            className="rounded px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExport()}
            className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-3.5 w-3.5" />
            {exporting ? "导出中…" : "导出"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
