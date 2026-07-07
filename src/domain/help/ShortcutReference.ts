import { SHORTCUT_LABELS } from "@/presentation/config/menuConfig";
import {
  SELECTION_MODE_SHORTCUTS,
  TOOL_SHORTCUTS,
} from "@/presentation/config/toolShortcuts";

export interface ShortcutReferenceEntry {
  shortcut: string;
  description: string;
}

export interface ShortcutReferenceSection {
  title: string;
  entries: ShortcutReferenceEntry[];
}

export const SHORTCUT_REFERENCE_SECTIONS: ShortcutReferenceSection[] = [
  {
    title: "文件",
    entries: [
      { shortcut: SHORTCUT_LABELS.newProject, description: "新建项目" },
      { shortcut: SHORTCUT_LABELS.openProject, description: "打开项目" },
      { shortcut: SHORTCUT_LABELS.saveCurrentProject, description: "保存项目" },
      { shortcut: SHORTCUT_LABELS.saveProjectAs, description: "另存为" },
    ],
  },
  {
    title: "编辑",
    entries: [
      { shortcut: SHORTCUT_LABELS.undo, description: "撤销" },
      { shortcut: `${SHORTCUT_LABELS.redo} / Ctrl+Shift+Z`, description: "重做" },
      { shortcut: SHORTCUT_LABELS.selectAll, description: "全选画布" },
      { shortcut: SHORTCUT_LABELS.deselect, description: "取消选区" },
      { shortcut: SHORTCUT_LABELS.invertSelection, description: "反选" },
      { shortcut: SHORTCUT_LABELS.copy, description: "复制（选区或图层，取决于焦点）" },
      { shortcut: SHORTCUT_LABELS.cut, description: "剪切选区" },
      { shortcut: SHORTCUT_LABELS.paste, description: "粘贴（选区或图层，取决于焦点）" },
      { shortcut: "Ctrl+B", description: "从选区创建图案笔刷" },
    ],
  },
  {
    title: "工具",
    entries: [
      { shortcut: TOOL_SHORTCUTS.brush, description: "画笔工具" },
      { shortcut: TOOL_SHORTCUTS.fill, description: "填充工具" },
      { shortcut: TOOL_SHORTCUTS.eraser, description: "橡皮工具" },
      { shortcut: TOOL_SHORTCUTS.shape, description: "形状工具" },
      { shortcut: TOOL_SHORTCUTS.select, description: "选区工具（矩形模式）" },
      { shortcut: SELECTION_MODE_SHORTCUTS.magicWand ?? "W", description: "选区工具（魔棒模式）" },
      { shortcut: TOOL_SHORTCUTS.transform, description: "变换工具" },
      { shortcut: "Ctrl+T", description: "激活变换工具" },
      { shortcut: TOOL_SHORTCUTS.repeatTile, description: "重复 Tile 工具" },
      { shortcut: TOOL_SHORTCUTS.canvasResize, description: "画板尺寸工具" },
    ],
  },
  {
    title: "选区",
    entries: [
      { shortcut: "Esc", description: "取消选区" },
      { shortcut: "Enter", description: "提交浮动选区" },
      { shortcut: "Delete / Backspace", description: "删除选区内容" },
      { shortcut: SHORTCUT_LABELS.flipHorizontal, description: "水平翻转选区" },
      { shortcut: SHORTCUT_LABELS.flipVertical, description: "垂直翻转选区" },
      { shortcut: "[ / ]", description: "逆时针 / 顺时针旋转选区 90°" },
      { shortcut: "↑ ↓ ← →", description: "微移选区 1 像素" },
      { shortcut: "Shift+↑ ↓ ← →", description: "微移选区 10 像素" },
    ],
  },
  {
    title: "视图",
    entries: [
      { shortcut: SHORTCUT_LABELS.toggleOklchLightness, description: "切换 OKLCH 明度显示" },
      { shortcut: SHORTCUT_LABELS.toggleGrid, description: "切换网格显示" },
      { shortcut: SHORTCUT_LABELS.fitActiveCanvas, description: "适配活动画板到视口" },
    ],
  },
  {
    title: "画布交互",
    entries: [
      { shortcut: "Alt+点击", description: "取色（吸管，松开时判定）" },
      { shortcut: "Alt+拖拽", description: "形状工具从中心绘制（矩形/椭圆）；拖拽时不取色" },
      { shortcut: "Space", description: "按住时切换为平移模式" },
      { shortcut: "中键拖拽", description: "平移画布视口" },
    ],
  },
];
