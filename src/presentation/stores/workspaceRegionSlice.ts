import {
  resolveActiveRegion,
  type WorkspaceRegion,
} from "@/domain/workspace/WorkspaceRegion";

export interface WorkspaceRegionSliceState {
  /** 当前激活的主区域；`null` 表示没有任何主区域处于激活态。 */
  activeRegion: WorkspaceRegion | null;
}

export interface WorkspaceRegionSliceActions {
  setActiveRegion: (region: WorkspaceRegion | null) => void;
}

type WorkspaceRegionSet = (
  partial:
    | Partial<WorkspaceRegionSliceState>
    | ((state: WorkspaceRegionSliceState) => Partial<WorkspaceRegionSliceState>),
) => void;

type WorkspaceRegionGet = () => WorkspaceRegionSliceState;

export function createWorkspaceRegionInitialState(): WorkspaceRegionSliceState {
  return {
    activeRegion: "canvas",
  };
}

export function createWorkspaceRegionSlice(
  set: WorkspaceRegionSet,
  get: WorkspaceRegionGet,
): WorkspaceRegionSliceState & WorkspaceRegionSliceActions {
  return {
    ...createWorkspaceRegionInitialState(),

    setActiveRegion: (region) => {
      set({ activeRegion: resolveActiveRegion(get().activeRegion, region) });
    },
  };
}
