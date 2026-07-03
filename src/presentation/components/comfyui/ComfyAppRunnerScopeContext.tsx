import { createContext, useContext } from "react";
import type { RunnerScope } from "@/domain/comfyApp/RunnerScope";

const ComfyAppRunnerScopeContext = createContext<RunnerScope | null>(null);

export function ComfyAppRunnerScopeProvider({
  scope,
  children,
}: {
  scope: RunnerScope;
  children: React.ReactNode;
}) {
  return (
    <ComfyAppRunnerScopeContext.Provider value={scope}>{children}</ComfyAppRunnerScopeContext.Provider>
  );
}

export function useComfyAppRunnerScope(): RunnerScope {
  const scope = useContext(ComfyAppRunnerScopeContext);
  if (!scope) {
    throw new Error("useComfyAppRunnerScope 必须在 ComfyAppRunnerScopeProvider 内使用");
  }
  return scope;
}
