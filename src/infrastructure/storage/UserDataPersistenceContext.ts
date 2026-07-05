let activeSoftwareDataPath: string | null = null;
let isHydratingUserData = false;

export function setActiveSoftwareDataPath(path: string | null): void {
  activeSoftwareDataPath = path;
}

export function getActiveSoftwareDataPath(): string | null {
  return activeSoftwareDataPath;
}

export function setUserDataHydrating(value: boolean): void {
  isHydratingUserData = value;
}

export function isUserDataHydrating(): boolean {
  return isHydratingUserData;
}
