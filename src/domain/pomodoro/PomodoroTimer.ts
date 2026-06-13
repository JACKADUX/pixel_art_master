export type PomodoroStatus = "idle" | "running" | "paused";

export interface PomodoroState {
  totalSeconds: number;
  remainingSeconds: number;
  status: PomodoroStatus;
}

export const DEFAULT_POMODORO_MINUTES = 25;
export const MIN_POMODORO_MINUTES = 1;
export const MAX_POMODORO_MINUTES = 120;

export function minutesToSeconds(minutes: number): number {
  return clampPomodoroMinutes(minutes) * 60;
}

export function clampPomodoroMinutes(minutes: number): number {
  return Math.min(MAX_POMODORO_MINUTES, Math.max(MIN_POMODORO_MINUTES, Math.round(minutes)));
}

export function createInitialState(
  minutes: number = DEFAULT_POMODORO_MINUTES,
): PomodoroState {
  const totalSeconds = minutesToSeconds(minutes);
  return {
    totalSeconds,
    remainingSeconds: totalSeconds,
    status: "idle",
  };
}

export function formatPomodoroTime(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function startTimer(state: PomodoroState): PomodoroState {
  if (state.status === "running") return state;

  if (state.status === "idle") {
    return {
      ...state,
      remainingSeconds: state.totalSeconds,
      status: "running",
    };
  }

  return { ...state, status: "running" };
}

export function pauseTimer(state: PomodoroState): PomodoroState {
  if (state.status !== "running") return state;
  return { ...state, status: "paused" };
}

export function resetTimer(state: PomodoroState): PomodoroState {
  return {
    ...state,
    remainingSeconds: state.totalSeconds,
    status: "idle",
  };
}

export interface TickResult {
  state: PomodoroState;
  completed: boolean;
}

export function tickTimer(state: PomodoroState): TickResult {
  if (state.status !== "running") {
    return { state, completed: false };
  }

  if (state.remainingSeconds <= 0) {
    return {
      state: resetTimer(state),
      completed: true,
    };
  }

  const remainingSeconds = state.remainingSeconds - 1;

  if (remainingSeconds <= 0) {
    return {
      state: {
        ...state,
        remainingSeconds: 0,
        status: "idle",
      },
      completed: true,
    };
  }

  return {
    state: { ...state, remainingSeconds },
    completed: false,
  };
}

export function setDurationMinutes(
  _state: PomodoroState,
  minutes: number,
): PomodoroState {
  const totalSeconds = minutesToSeconds(minutes);
  return {
    totalSeconds,
    remainingSeconds: totalSeconds,
    status: "idle",
  };
}
