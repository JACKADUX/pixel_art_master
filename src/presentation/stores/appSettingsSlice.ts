import { loadAppSettings } from "@/application/use-cases/LoadAppSettings";
import { saveAppSettings } from "@/application/use-cases/SaveAppSettings";
import type { IAppSettingsRepository } from "@/application/ports/IAppSettingsRepository";
import {
  clampAutoSaveIntervalMinutes,
  clampCheckerboardTileSize,
  clampGridLineWidth,
  clampGridSize,
  clampSymmetryAxisLineWidth,
  type AppSettings,
} from "@/domain/appSettings/AppSettings";
import { fromHex, toHex } from "@/domain/canvas/PixelColor";
import type { Project } from "@/domain/project/Project";

export interface AppSettingsSliceState {
  appSettings: AppSettings;
}

export interface AppSettingsSliceActions {
  setAppSettings: (settings: AppSettings) => void;
  updateAppSettings: (partial: Partial<AppSettings>) => void;
  setAutoSaveIntervalMinutes: (minutes: number) => void;
  setPomodoroVisible: (visible: boolean) => void;
  setDefaultGridPrimary: (size: number) => void;
  setDefaultGridSecondary: (size: number) => void;
  setGridColorHex: (hex: string) => void;
  setGridLineWidth: (width: number) => void;
  setSubGridEnabled: (enabled: boolean) => void;
  setCheckerboardTileSize: (size: number) => void;
  setCheckerboardLightHex: (hex: string) => void;
  setCheckerboardDarkHex: (hex: string) => void;
  setImageViewerCheckerboardEnabled: (enabled: boolean) => void;
  setImageViewerSelectionModeEnabled: (enabled: boolean) => void;
  setSymmetryAxisVisible: (visible: boolean) => void;
  setSymmetryAxisColorHex: (hex: string) => void;
  setSymmetryAxisLineWidth: (width: number) => void;
  setSymmetryAxisOutlineEnabled: (enabled: boolean) => void;
}

type AppSettingsSet = (
  partial:
    | Partial<AppSettingsSliceState & { project: Project | null }>
    | ((state: AppSettingsSliceState & { project: Project | null }) => Partial<
        AppSettingsSliceState & { project: Project | null }
      >),
) => void;

type AppSettingsGet = () => AppSettingsSliceState & { project: Project | null };

function applyGridSizesToProject(
  project: Project,
  primary: number,
  secondary: number,
): Project {
  return {
    ...project,
    grid: {
      ...project.grid,
      primary,
      secondary,
    },
  };
}

function withGridSizes(
  get: AppSettingsGet,
  primary: number,
  secondary: number,
): Partial<AppSettingsSliceState & { project: Project | null }> {
  const clampedPrimary = clampGridSize(primary);
  const clampedSecondary = clampGridSize(Math.min(secondary, clampedPrimary));
  const appSettings = {
    ...get().appSettings,
    defaultGridPrimary: clampedPrimary,
    defaultGridSecondary: clampedSecondary,
  };
  const project = get().project;
  return {
    appSettings,
    project: project
      ? applyGridSizesToProject(project, clampedPrimary, clampedSecondary)
      : null,
  };
}

export function createAppSettingsInitialState(
  repository: IAppSettingsRepository,
): AppSettingsSliceState {
  return {
    appSettings: loadAppSettings(repository),
  };
}

export function createAppSettingsSlice(
  set: AppSettingsSet,
  get: AppSettingsGet,
  repository: IAppSettingsRepository,
): AppSettingsSliceState & AppSettingsSliceActions {
  return {
    ...createAppSettingsInitialState(repository),

    setAppSettings: (settings) => set({ appSettings: settings }),

    updateAppSettings: (partial) =>
      set((state) => ({
        appSettings: { ...state.appSettings, ...partial },
      })),

    setAutoSaveIntervalMinutes: (minutes) =>
      set((state) => ({
        appSettings: {
          ...state.appSettings,
          autoSaveIntervalMinutes: clampAutoSaveIntervalMinutes(minutes),
        },
      })),

    setPomodoroVisible: (visible) =>
      set((state) => ({
        appSettings: { ...state.appSettings, pomodoroVisible: visible },
      })),

    setDefaultGridPrimary: (size) => {
      const { appSettings } = get();
      set(withGridSizes(get, size, appSettings.defaultGridSecondary));
    },

    setDefaultGridSecondary: (size) => {
      const { appSettings } = get();
      set(withGridSizes(get, appSettings.defaultGridPrimary, size));
    },

    setGridColorHex: (hex) =>
      set((state) => ({
        appSettings: { ...state.appSettings, gridColorHex: toHex(fromHex(hex)) },
      })),

    setGridLineWidth: (width) =>
      set((state) => ({
        appSettings: {
          ...state.appSettings,
          gridLineWidth: clampGridLineWidth(width),
        },
      })),

    setSubGridEnabled: (enabled) =>
      set((state) => ({
        appSettings: { ...state.appSettings, subGridEnabled: enabled },
      })),

    setCheckerboardTileSize: (size) =>
      set((state) => ({
        appSettings: {
          ...state.appSettings,
          checkerboardTileSize: clampCheckerboardTileSize(size),
        },
      })),

    setCheckerboardLightHex: (hex) =>
      set((state) => ({
        appSettings: {
          ...state.appSettings,
          checkerboardLightHex: toHex(fromHex(hex)),
        },
      })),

    setCheckerboardDarkHex: (hex) =>
      set((state) => ({
        appSettings: {
          ...state.appSettings,
          checkerboardDarkHex: toHex(fromHex(hex)),
        },
      })),

    setImageViewerCheckerboardEnabled: (enabled) =>
      set((state) => ({
        appSettings: { ...state.appSettings, imageViewerCheckerboardEnabled: enabled },
      })),

    setImageViewerSelectionModeEnabled: (enabled) =>
      set((state) => ({
        appSettings: { ...state.appSettings, imageViewerSelectionModeEnabled: enabled },
      })),

    setSymmetryAxisVisible: (visible) =>
      set((state) => ({
        appSettings: { ...state.appSettings, symmetryAxisVisible: visible },
      })),

    setSymmetryAxisColorHex: (hex) =>
      set((state) => ({
        appSettings: {
          ...state.appSettings,
          symmetryAxisColorHex: toHex(fromHex(hex)),
        },
      })),

    setSymmetryAxisLineWidth: (width) =>
      set((state) => ({
        appSettings: {
          ...state.appSettings,
          symmetryAxisLineWidth: clampSymmetryAxisLineWidth(width),
        },
      })),

    setSymmetryAxisOutlineEnabled: (enabled) =>
      set((state) => ({
        appSettings: { ...state.appSettings, symmetryAxisOutlineEnabled: enabled },
      })),
  };
}

let appSettingsSaveTimer: ReturnType<typeof setTimeout> | null = null;
let isHydratingAppSettings = false;

export function subscribeAppSettingsPersistence(
  getState: () => AppSettingsSliceState,
  repository: IAppSettingsRepository,
): void {
  if (isHydratingAppSettings) return;

  if (appSettingsSaveTimer) {
    clearTimeout(appSettingsSaveTimer);
  }

  appSettingsSaveTimer = setTimeout(() => {
    saveAppSettings(repository, getState().appSettings);
    appSettingsSaveTimer = null;
  }, 300);
}

export function setAppSettingsHydrating(value: boolean): void {
  isHydratingAppSettings = value;
}

export function applyAppSettingsGridDefaults(project: Project, settings: AppSettings): Project {
  return applyGridSizesToProject(
    project,
    settings.defaultGridPrimary,
    settings.defaultGridSecondary,
  );
}
