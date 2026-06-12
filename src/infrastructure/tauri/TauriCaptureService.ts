import type {
  CapturableMonitor,
  CapturableWindow,
  ICaptureService,
} from "@/application/ports/ICaptureService";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  getMonitorScreenshot,
  getScreenshotableMonitors,
  getScreenshotableWindows,
  getWindowScreenshot,
} from "tauri-plugin-screenshots-api";

const APP_NAMES = ["pixelart-master", "PixelArt Master", "tauri-app"];

function isOwnWindow(win: { title: string; appName: string }): boolean {
  return APP_NAMES.some(
    (name) =>
      win.appName.toLowerCase().includes(name.toLowerCase()) ||
      win.title.toLowerCase().includes(name.toLowerCase()),
  );
}

export class TauriCaptureService implements ICaptureService {
  async listWindows(): Promise<CapturableWindow[]> {
    const windows = await getScreenshotableWindows();
    return windows
      .filter((w) => !isOwnWindow(w))
      .map((w) => ({
        id: w.id,
        title: w.title || "未命名窗口",
        appName: w.appName || "",
      }));
  }

  async listMonitors(): Promise<CapturableMonitor[]> {
    const monitors = await getScreenshotableMonitors();
    return monitors.map((m) => ({
      id: m.id,
      name: m.name || `显示器 ${m.id}`,
    }));
  }

  async captureWindow(windowId: number): Promise<string> {
    return getWindowScreenshot(windowId);
  }

  async captureMonitor(monitorId: number): Promise<string> {
    return getMonitorScreenshot(monitorId);
  }

  async hideApp(): Promise<void> {
    await getCurrentWindow().hide();
    await new Promise((r) => setTimeout(r, 300));
  }

  async showApp(): Promise<void> {
    await getCurrentWindow().show();
  }
}

export const captureService = new TauriCaptureService();
