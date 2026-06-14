import {
  canApplyFixedScaleRestore,
  computeRestoreOutputSize,
} from "@/domain/pixelRestore/FixedScaleRestoreOperations";
import { MIN_RESTORE_SCALE, MAX_RESTORE_SCALE } from "@/domain/pixelRestore/RestoreScale";

const PRESET_SCALES = [1, 2, 3, 4, 5, 6, 8];

function formatScaleLabel(scale: number): string {
  return scale === 1 ? "不缩放" : `${scale}x`;
}

interface FixedScaleControlsProps {
  detectedScale: number;
  selectedScale: number;
  sourceWidth: number;
  sourceHeight: number;
  error: string | null;
  canExport: boolean;
  onScaleChange: (scale: number) => void;
  onExport: () => void;
}

export function FixedScaleControls({
  detectedScale,
  selectedScale,
  sourceWidth,
  sourceHeight,
  error,
  canExport,
  onScaleChange,
  onExport,
}: FixedScaleControlsProps) {
  const source = { width: sourceWidth, height: sourceHeight };
  const outputSize = canApplyFixedScaleRestore(source, { value: selectedScale })
    ? computeRestoreOutputSize(source, { value: selectedScale })
    : null;

  const handleInputChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    onScaleChange(parsed);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-xs font-medium text-zinc-300">固定缩放</h3>
        <p className="text-[11px] text-zinc-500">
          将放大后的像素块按固定倍数缩小，取每个块左上角像素作为结果；选择「不缩放」则保持原图尺寸。
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] text-zinc-500">
          自动检测倍数：
          <span className="ml-1 font-medium text-zinc-300">{detectedScale}x</span>
        </p>
        <p className="mb-2 text-[11px] text-zinc-500">缩放倍数</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SCALES.map((scale) => {
            const valid = canApplyFixedScaleRestore(source, { value: scale });
            const active = selectedScale === scale;
            return (
              <button
                key={scale}
                type="button"
                disabled={!valid}
                onClick={() => onScaleChange(scale)}
                className={`rounded px-2.5 py-1 text-xs ${
                  active
                    ? "bg-blue-600 text-white"
                    : valid
                      ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      : "cursor-not-allowed bg-zinc-900 text-zinc-600"
                }`}
              >
                {formatScaleLabel(scale)}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-[11px] text-zinc-500" htmlFor="restore-scale-input">
            自定义
          </label>
          <input
            id="restore-scale-input"
            type="number"
            min={MIN_RESTORE_SCALE}
            max={MAX_RESTORE_SCALE}
            value={selectedScale}
            onChange={(event) => handleInputChange(event.target.value)}
            className="w-16 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
          />
          <span className="text-[11px] text-zinc-600">倍</span>
        </div>
      </div>

      {outputSize ? (
        <p className="text-[11px] text-zinc-400">
          输出尺寸：
          <span className="ml-1 font-medium text-zinc-200">
            {outputSize.width} × {outputSize.height}
          </span>
        </p>
      ) : (
        <p className="text-[11px] text-amber-500/90">
          当前倍数无法整除原图尺寸（{sourceWidth} × {sourceHeight}）
        </p>
      )}

      {error && (
        <p className="text-[11px] text-red-400">{error}</p>
      )}
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-800 p-4">
        <button
          type="button"
          disabled={!canExport || !outputSize}
          onClick={onExport}
          className="w-full rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          导出到资产库
        </button>
        {!canExport && (
          <p className="mt-2 text-center text-[10px] text-zinc-600">
            请先选择项目文件夹并生成结果
          </p>
        )}
      </div>
    </div>
  );
}
