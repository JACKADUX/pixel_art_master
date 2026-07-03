/** ComfyUI 应用运行窗口的挂载场景 */
export type RunnerScope = "canvas" | "workflow";

export const RUNNER_SCOPES: readonly RunnerScope[] = ["canvas", "workflow"] as const;
