export interface CapturableWindow {
  id: number;
  title: string;
  appName: string;
}

export interface CapturableMonitor {
  id: number;
  name: string;
}

export interface ICaptureService {
  listWindows(): Promise<CapturableWindow[]>;
  listMonitors(): Promise<CapturableMonitor[]>;
  captureWindow(windowId: number): Promise<string>;
  captureMonitor(monitorId: number): Promise<string>;
  hideApp(): Promise<void>;
  showApp(): Promise<void>;
}
