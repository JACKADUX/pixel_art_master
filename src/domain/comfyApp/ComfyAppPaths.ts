import { joinPath } from "@/domain/asset/AssetLibraryPaths";

/** 应用备份根目录名（位于用户项目路径下） */
export const COMFY_WORKFLOW_DIR = "comfyui_workflow";
/** 应用清单文件名 */
export const COMFY_APP_MANIFEST_FILE = "app.json";
/** 工作流备份文件名 */
export const COMFY_APP_WORKFLOW_FILE = "workflow.json";

export function buildComfyWorkflowRoot(workspacePath: string): string {
  return joinPath(workspacePath, COMFY_WORKFLOW_DIR);
}

export function buildComfyAppDir(workspacePath: string, appId: string): string {
  return joinPath(buildComfyWorkflowRoot(workspacePath), appId);
}

export function buildComfyAppManifestPath(workspacePath: string, appId: string): string {
  return joinPath(buildComfyAppDir(workspacePath, appId), COMFY_APP_MANIFEST_FILE);
}

export function buildComfyAppWorkflowPath(workspacePath: string, appId: string): string {
  return joinPath(buildComfyAppDir(workspacePath, appId), COMFY_APP_WORKFLOW_FILE);
}
