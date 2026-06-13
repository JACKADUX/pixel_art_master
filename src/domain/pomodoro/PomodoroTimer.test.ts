import { describe, expect, it } from "vitest";
import {
  clampPomodoroMinutes,
  createInitialState,
  formatPomodoroTime,
  pauseTimer,
  resetTimer,
  setDurationMinutes,
  startTimer,
  tickTimer,
} from "@/domain/pomodoro/PomodoroTimer";

describe("PomodoroTimer", () => {
  it("formats seconds as MM:SS", () => {
    expect(formatPomodoroTime(1500)).toBe("25:00");
    expect(formatPomodoroTime(65)).toBe("01:05");
    expect(formatPomodoroTime(0)).toBe("00:00");
    expect(formatPomodoroTime(-5)).toBe("00:00");
  });

  it("clamps minutes to valid range", () => {
    expect(clampPomodoroMinutes(0)).toBe(1);
    expect(clampPomodoroMinutes(25)).toBe(25);
    expect(clampPomodoroMinutes(200)).toBe(120);
    expect(clampPomodoroMinutes(25.6)).toBe(26);
  });

  it("creates initial state with default 25 minutes", () => {
    const state = createInitialState();
    expect(state.totalSeconds).toBe(1500);
    expect(state.remainingSeconds).toBe(1500);
    expect(state.status).toBe("idle");
  });

  it("transitions idle -> running -> paused -> running", () => {
    let state = createInitialState();
    state = startTimer(state);
    expect(state.status).toBe("running");
    expect(state.remainingSeconds).toBe(1500);

    state = pauseTimer(state);
    expect(state.status).toBe("paused");

    state = startTimer(state);
    expect(state.status).toBe("running");
    expect(state.remainingSeconds).toBe(1500);
  });

  it("resets to idle with full remaining time", () => {
    let state = createInitialState();
    state = startTimer(state);
    state = { ...state, remainingSeconds: 900 };
    state = resetTimer(state);
    expect(state.status).toBe("idle");
    expect(state.remainingSeconds).toBe(1500);
  });

  it("ticks down remaining seconds while running", () => {
    let state = createInitialState();
    state = startTimer(state);
    const result = tickTimer(state);
    expect(result.completed).toBe(false);
    expect(result.state.remainingSeconds).toBe(1499);
  });

  it("completes when remaining reaches zero", () => {
    let state = createInitialState();
    state = { ...state, status: "running", remainingSeconds: 1 };
    const result = tickTimer(state);
    expect(result.completed).toBe(true);
    expect(result.state.remainingSeconds).toBe(0);
    expect(result.state.status).toBe("idle");
  });

  it("does not tick when paused or idle", () => {
    const idle = createInitialState();
    expect(tickTimer(idle).state.remainingSeconds).toBe(1500);

    const paused = pauseTimer(startTimer(createInitialState()));
    expect(tickTimer(paused).state.remainingSeconds).toBe(1500);
  });

  it("sets duration in minutes and resets state", () => {
    let state = createInitialState();
    state = startTimer(state);
    state = setDurationMinutes(state, 30);
    expect(state.totalSeconds).toBe(1800);
    expect(state.remainingSeconds).toBe(1800);
    expect(state.status).toBe("idle");
  });
});
