/** 原生层（Tauri/WebView2）向页面同步 Alt 修饰键状态时使用的自定义事件名。 */
export const ALT_MODIFIER_SYNC_EVENT = "pixelart-alt-modifier";

export interface AltModifierSyncDetail {
  pressed: boolean;
}

export function dispatchAltModifierSync(pressed: boolean): void {
  window.dispatchEvent(
    new CustomEvent<AltModifierSyncDetail>(ALT_MODIFIER_SYNC_EVENT, {
      detail: { pressed },
    }),
  );
}
