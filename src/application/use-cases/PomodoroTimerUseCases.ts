import {
  pauseTimer,
  resetTimer,
  setDurationMinutes,
  startTimer,
  tickTimer,
  type PomodoroState,
  type TickResult,
} from "@/domain/pomodoro/PomodoroTimer";

export function startPomodoro(state: PomodoroState): PomodoroState {
  return startTimer(state);
}

export function pausePomodoro(state: PomodoroState): PomodoroState {
  return pauseTimer(state);
}

export function resetPomodoro(state: PomodoroState): PomodoroState {
  return resetTimer(state);
}

export function tickPomodoro(state: PomodoroState): TickResult {
  return tickTimer(state);
}

export function changePomodoroDuration(
  state: PomodoroState,
  minutes: number,
): PomodoroState {
  return setDurationMinutes(state, minutes);
}
