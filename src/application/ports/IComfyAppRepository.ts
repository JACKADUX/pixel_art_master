import type { ComfyApp } from "@/domain/comfyApp/ComfyApp";
import type { ComfyApiWorkflow } from "@/domain/comfyui/ComfyWorkflow";

/** 应用 + 其备份工作流的完整记录 */
export interface ComfyAppRecord {
  app: ComfyApp;
  workflow: ComfyApiWorkflow;
}

/** 应用持久化端口（基础设施以 Tauri 文件系统实现，存于项目路径 comfyui_workflow 下） */
export interface IComfyAppRepository {
  /** 保存应用：写入清单 app.json 与工作流备份 workflow.json */
  save(workspacePath: string, app: ComfyApp, workflow: ComfyApiWorkflow): Promise<void>;
  /** 扫描目录，列出全部应用（仅清单，不含工作流） */
  list(workspacePath: string): Promise<ComfyApp[]>;
  /** 读取单个应用的完整记录（含工作流），不存在返回 null */
  load(workspacePath: string, appId: string): Promise<ComfyAppRecord | null>;
  /** 删除应用整个子目录 */
  delete(workspacePath: string, appId: string): Promise<void>;
}
