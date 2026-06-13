import { useCallback, useEffect, useRef, useState } from "react";
import {
  changePomodoroDuration,
  pausePomodoro,
  resetPomodoro,
  startPomodoro,
  tickPomodoro,
} from "@/application/use-cases/PomodoroTimerUseCases";
import {
  createInitialState,
  formatPomodoroTime,
  type PomodoroStatus,
} from "@/domain/pomodoro/PomodoroTimer";
import { toast } from "../stores/toastStore";

export function usePomodoroTimer() {
  const [state, setState] = useState(createInitialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state.status !== "running") {
      clearIntervalRef();
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        const result = tickPomodoro(prev);
        if (result.completed) {
          toast.info("番茄钟时间到！");
          return resetPomodoro(prev);
        }
        return result.state;
      });
    }, 1000);

    return clearIntervalRef;
  }, [state.status, clearIntervalRef]);

  useEffect(() => {
    return clearIntervalRef;
  }, [clearIntervalRef]);

  const start = useCallback(() => {
    setState((prev) => startPomodoro(prev));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => pausePomodoro(prev));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => resetPomodoro(prev));
  }, []);

  const setDurationMinutes = useCallback((minutes: number) => {
    setState((prev) => changePomodoroDuration(prev, minutes));
  }, []);

  return {
    displayTime: formatPomodoroTime(state.remainingSeconds),
    totalMinutes: Math.round(state.totalSeconds / 60),
    status: state.status as PomodoroStatus,
    start,
    pause,
    reset,
    setDurationMinutes,
  };
}
