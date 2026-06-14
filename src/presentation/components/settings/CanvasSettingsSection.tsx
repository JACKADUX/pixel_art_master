import {
  MAX_CHECKERBOARD_TILE_SIZE,
  MAX_GRID_LINE_WIDTH,
  MAX_GRID_SIZE,
  MIN_CHECKERBOARD_TILE_SIZE,
  MIN_GRID_LINE_WIDTH,
  MIN_GRID_SIZE,
} from "@/domain/appSettings/AppSettings";
import { useAppStore } from "../../stores/appStore";
import {
  CheckerboardPreview,
  SettingsColorInput,
  SettingsGroup,
  SettingsNumberInput,
  SettingsRow,
  SettingsToggle,
} from "./SettingsField";

export function CanvasSettingsSection() {
  const project = useAppStore((s) => s.project);
  const defaultGridPrimary = useAppStore((s) => s.appSettings.defaultGridPrimary);
  const defaultGridSecondary = useAppStore((s) => s.appSettings.defaultGridSecondary);
  const gridColorHex = useAppStore((s) => s.appSettings.gridColorHex);
  const gridLineWidth = useAppStore((s) => s.appSettings.gridLineWidth);
  const subGridEnabled = useAppStore((s) => s.appSettings.subGridEnabled);
  const checkerboardTileSize = useAppStore((s) => s.appSettings.checkerboardTileSize);
  const checkerboardLightHex = useAppStore((s) => s.appSettings.checkerboardLightHex);
  const checkerboardDarkHex = useAppStore((s) => s.appSettings.checkerboardDarkHex);
  const gridVisible = project?.grid.visible ?? true;

  const setDefaultGridPrimary = useAppStore((s) => s.setDefaultGridPrimary);
  const setDefaultGridSecondary = useAppStore((s) => s.setDefaultGridSecondary);
  const setGridColorHex = useAppStore((s) => s.setGridColorHex);
  const setGridLineWidth = useAppStore((s) => s.setGridLineWidth);
  const setSubGridEnabled = useAppStore((s) => s.setSubGridEnabled);
  const setCheckerboardTileSize = useAppStore((s) => s.setCheckerboardTileSize);
  const setCheckerboardLightHex = useAppStore((s) => s.setCheckerboardLightHex);
  const setCheckerboardDarkHex = useAppStore((s) => s.setCheckerboardDarkHex);
  const toggleGrid = useAppStore((s) => s.toggleGrid);

  return (
    <div className="flex flex-col gap-5">
      <SettingsGroup
        title="网格"
        description="主网格与子网格尺寸会同步到当前项目；新建项目时作为默认值。"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsRow label="主网格尺寸">
            <SettingsNumberInput
              value={defaultGridPrimary}
              min={MIN_GRID_SIZE}
              max={MAX_GRID_SIZE}
              suffix="px"
              onChange={setDefaultGridPrimary}
            />
          </SettingsRow>
          <SettingsRow label="子网格尺寸">
            <SettingsNumberInput
              value={defaultGridSecondary}
              min={MIN_GRID_SIZE}
              max={defaultGridPrimary}
              suffix="px"
              onChange={setDefaultGridSecondary}
            />
          </SettingsRow>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsRow label="线条粗细">
            <SettingsNumberInput
              value={gridLineWidth}
              min={MIN_GRID_LINE_WIDTH}
              max={MAX_GRID_LINE_WIDTH}
              step={0.5}
              onChange={setGridLineWidth}
            />
          </SettingsRow>
          <SettingsRow label="网格颜色">
            <SettingsColorInput value={gridColorHex} onChange={setGridColorHex} />
          </SettingsRow>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-700/60 pt-3">
          <SettingsToggle label="显示网格" checked={gridVisible} onChange={() => toggleGrid()} />
          <SettingsToggle
            label="显示子网格"
            hint="在主网格之间绘制较淡的子网格线"
            checked={subGridEnabled}
            onChange={setSubGridEnabled}
          />
        </div>
      </SettingsGroup>

      <SettingsGroup title="画布棋盘格" description="用于表示透明区域的背景图案。">
        <SettingsRow
          label="格子尺寸"
          hint={`${MIN_CHECKERBOARD_TILE_SIZE}–${MAX_CHECKERBOARD_TILE_SIZE} px`}
        >
          <SettingsNumberInput
            value={checkerboardTileSize}
            min={MIN_CHECKERBOARD_TILE_SIZE}
            max={MAX_CHECKERBOARD_TILE_SIZE}
            suffix="px"
            onChange={setCheckerboardTileSize}
          />
        </SettingsRow>

        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsRow label="浅色格">
            <SettingsColorInput
              value={checkerboardLightHex}
              onChange={setCheckerboardLightHex}
              preview={
                <CheckerboardPreview
                  lightColor={checkerboardLightHex}
                  darkColor={checkerboardDarkHex}
                  tileSize={4}
                />
              }
            />
          </SettingsRow>
          <SettingsRow label="深色格">
            <SettingsColorInput
              value={checkerboardDarkHex}
              onChange={setCheckerboardDarkHex}
              preview={
                <CheckerboardPreview
                  lightColor={checkerboardLightHex}
                  darkColor={checkerboardDarkHex}
                  tileSize={4}
                />
              }
            />
          </SettingsRow>
        </div>
      </SettingsGroup>
    </div>
  );
}
