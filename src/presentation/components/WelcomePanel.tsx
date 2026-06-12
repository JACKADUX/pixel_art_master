import { loadProject } from "@/application/use-cases/LoadProject";
import { projectRepository } from "@/infrastructure/storage/JsonProjectRepository";
import { useAppStore } from "../stores/appStore";

export function WelcomePanel() {
  const getRecentProjects = useAppStore((s) => s.getRecentProjects);
  const openProject = useAppStore((s) => s.openProject);
  const screenCapture = useAppStore((s) => s.screenCapture);
  const importImage = useAppStore((s) => s.importImage);
  const recent = getRecentProjects();

  const openRecent = async (path: string) => {
    const project = await loadProject(projectRepository, path);
    useAppStore.setState({
      project,
      detectedScale: project.canvas.scaleFactor,
      manualScaleOverride: null,
      editingNoteId: null,
      draftNote: "",
    });
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-800/80">
      <div className="max-w-md rounded-lg border border-zinc-600 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold text-zinc-100">PixelArt Master</h2>
        <p className="mb-4 text-sm text-zinc-400">
          截图像素游戏画面，缩小还原并提取色板，在绘制层上继续创作。
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={screenCapture}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            屏幕截图
          </button>
          <button
            type="button"
            onClick={importImage}
            className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600"
          >
            导入图片
          </button>
          <button
            type="button"
            onClick={openProject}
            className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600"
          >
            打开项目
          </button>
        </div>
        {recent.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium text-zinc-500">最近项目</h3>
            <ul className="space-y-1">
              {recent.map((path) => (
                <li key={path}>
                  <button
                    type="button"
                    onClick={() => openRecent(path)}
                    className="w-full truncate rounded px-2 py-1 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    title={path}
                  >
                    {path.split(/[/\\]/).pop()}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
