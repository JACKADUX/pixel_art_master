import type { MenuGroup } from "../components/MenuDropdown";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowsPointingOutIcon,
  CommandLineIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  DocumentPlusIcon,
  FolderOpenIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhotoIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  SwatchIcon,
} from "../icons/ActionIcons";

export const SHORTCUT_LABELS = {
  newProject: "Ctrl+N",
  openProject: "Ctrl+O",
  saveCurrentProject: "Ctrl+S",
  saveProjectAs: "Ctrl+Shift+S",
  undo: "Ctrl+Z",
  redo: "Ctrl+Y",
  selectAll: "Ctrl+A",
  deselect: "Ctrl+D",
  invertSelection: "Ctrl+Shift+I",
  copy: "Ctrl+C",
  cut: "Ctrl+X",
  paste: "Ctrl+V",
  flipHorizontal: "Shift+H",
  flipVertical: "Shift+V",
  toggleGrid: "Ctrl+' / Ctrl+2",
  toggleOklchLightness: "Ctrl+1",
} as const;

export type ShortcutAction = keyof typeof SHORTCUT_LABELS;

export interface MenuActions {
  newProject: () => void;
  openProject: () => void;
  saveCurrentProject: () => void;
  saveProjectAs: () => void;
  exportImage: () => void;
  hasOpenProject: () => boolean;
  importImage: () => void;
  openCanvasSizeModal: () => void;
  openProjectManager: () => void;
  toggleAlwaysOnTop: () => void;
  alwaysOnTop: boolean;
  toggleCanvasDisplayMode: () => void;
  canvasDisplayMode: "normal" | "oklchLightness";
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  selectAll: () => void;
  deselect: () => void;
  invertSelection: () => void;
  copySelection: () => void;
  cutSelection: () => void;
  pasteSelection: () => void;
  openPixelRestorePage: () => void;
  openColorEditPage: () => void;
  openWorldPage: () => void;
  openComfyUiPage: () => void;
  /** 已保存的 ComfyUI 应用列表（用于工具菜单二级子菜单） */
  comfyApps: { id: string; name: string }[];
  /** 在画布上以悬浮窗口打开指定 ComfyUI 应用 */
  openComfyAppWindow: (appId: string) => void;
  openAssetLibrary: () => void;
  openSettingsModal: () => void;
}

export function buildMenuGroups(actions: MenuActions): MenuGroup[] {
  return [
    {
      id: "file",
      label: "文件",
      items: [
        {
          type: "action",
          label: "新建",
          icon: DocumentPlusIcon,
          shortcut: SHORTCUT_LABELS.newProject,
          onClick: actions.newProject,
        },
        {
          type: "action",
          label: "打开",
          icon: FolderOpenIcon,
          shortcut: SHORTCUT_LABELS.openProject,
          onClick: actions.openProject,
        },
        { type: "separator" },
        {
          type: "action",
          label: "保存",
          icon: ArrowDownTrayIcon,
          shortcut: SHORTCUT_LABELS.saveCurrentProject,
          onClick: actions.saveCurrentProject,
        },
        {
          type: "action",
          label: "另存为",
          icon: DocumentDuplicateIcon,
          shortcut: SHORTCUT_LABELS.saveProjectAs,
          onClick: actions.saveProjectAs,
        },
        {
          type: "action",
          label: "导出为图片…",
          icon: ArrowUpTrayIcon,
          disabled: !actions.hasOpenProject(),
          onClick: actions.exportImage,
        },
        { type: "separator" },
        {
          type: "action",
          label: "导入图片",
          icon: PhotoIcon,
          onClick: actions.importImage,
        },
        { type: "separator" },
        {
          type: "action",
          label: "项目管理",
          icon: RectangleStackIcon,
          onClick: actions.openProjectManager,
        },
        {
          type: "action",
          label: "资产管理",
          icon: PhotoIcon,
          onClick: actions.openAssetLibrary,
        },
      ],
    },
    {
      id: "edit",
      label: "编辑",
      items: [
        {
          type: "action",
          label: "撤销",
          icon: ArrowUturnLeftIcon,
          shortcut: SHORTCUT_LABELS.undo,
          disabled: !actions.canUndo(),
          onClick: actions.undo,
        },
        {
          type: "action",
          label: "重做",
          icon: ArrowUturnRightIcon,
          shortcut: SHORTCUT_LABELS.redo,
          disabled: !actions.canRedo(),
          onClick: actions.redo,
        },
        { type: "separator" },
        {
          type: "action",
          label: "全选",
          shortcut: SHORTCUT_LABELS.selectAll,
          onClick: actions.selectAll,
        },
        {
          type: "action",
          label: "取消选区",
          shortcut: SHORTCUT_LABELS.deselect,
          onClick: actions.deselect,
        },
        {
          type: "action",
          label: "反选",
          icon: ArrowPathIcon,
          shortcut: SHORTCUT_LABELS.invertSelection,
          onClick: actions.invertSelection,
        },
        { type: "separator" },
        {
          type: "action",
          label: "复制",
          shortcut: SHORTCUT_LABELS.copy,
          onClick: actions.copySelection,
        },
        {
          type: "action",
          label: "剪切",
          shortcut: SHORTCUT_LABELS.cut,
          onClick: actions.cutSelection,
        },
        {
          type: "action",
          label: "粘贴",
          shortcut: SHORTCUT_LABELS.paste,
          onClick: actions.pasteSelection,
        },
        { type: "separator" },
        {
          type: "action",
          label: "设置…",
          icon: Cog6ToothIcon,
          onClick: actions.openSettingsModal,
        },
      ],
    },
    {
      id: "tools",
      label: "工具",
      items: [
        {
          type: "action",
          label: "像素还原…",
          icon: ArrowPathIcon,
          onClick: actions.openPixelRestorePage,
        },
        {
          type: "action",
          label: "颜色编辑…",
          icon: SwatchIcon,
          onClick: actions.openColorEditPage,
        },
        {
          type: "action",
          label: "世界创建器…",
          icon: GlobeAltIcon,
          onClick: actions.openWorldPage,
        },
        {
          type: "action",
          label: "ComfyUI 工作流…",
          icon: CommandLineIcon,
          onClick: actions.openComfyUiPage,
        },
        {
          type: "submenu",
          label: "ComfyUI 应用",
          icon: Squares2X2Icon,
          items:
            actions.comfyApps.length > 0
              ? actions.comfyApps.map((app) => ({
                  type: "action" as const,
                  label: app.name,
                  onClick: () => actions.openComfyAppWindow(app.id),
                }))
              : [
                  {
                    type: "action" as const,
                    label: "暂无应用",
                    onClick: () => {},
                    disabled: true,
                  },
                ],
        },
      ],
    },
    {
      id: "image",
      label: "图像",
      items: [
        {
          type: "action",
          label: "画布尺寸",
          icon: ArrowsPointingOutIcon,
          onClick: actions.openCanvasSizeModal,
        },
      ],
    },
    {
      id: "view",
      label: "视图",
      items: [
        {
          type: "toggle",
          label: "窗口置顶",
          icon: MapPinIcon,
          checked: actions.alwaysOnTop,
          onClick: actions.toggleAlwaysOnTop,
        },
        {
          type: "toggle",
          label: "OKLCH 明度",
          shortcut: SHORTCUT_LABELS.toggleOklchLightness,
          checked: actions.canvasDisplayMode === "oklchLightness",
          onClick: actions.toggleCanvasDisplayMode,
        },
      ],
    },
  ];
}
