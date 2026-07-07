mod color_edit;

use color_edit::cancel::request_cancel;
use color_edit::{apply_color_edit_pipeline, ColorEditRequest, ColorEditResponse};

#[tauri::command]
async fn apply_color_edit(request: ColorEditRequest) -> Result<ColorEditResponse, String> {
    tauri::async_runtime::spawn_blocking(move || apply_color_edit_pipeline(request))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
fn cancel_color_edit(job_id: u64) {
    request_cancel(job_id);
}

/// 在 Windows/WebView2 上拦截单独按下的 Alt 键。
///
/// Alt 是 Windows 系统键：默认情况下，单独按下并松开 Alt 会让 WebView2 把该加速键
/// 转发给宿主窗口去激活系统菜单，从而导致 WebView 失去输入焦点——表现为鼠标停止移动、
/// 必须点击一次才能恢复绘制。微软文档明确指出，对加速键而言网页内的 `preventDefault()`
/// 无法阻止该默认动作，只能在 `AcceleratorKeyPressed` 事件中将其标记为已处理。
///
/// 标记为已处理后 Alt 的 keydown 不会进入页面，因此需在此处主动注入修饰键状态，
/// 以便画笔等工具在鼠标不移动时也能显示吸管光标并支持同位置取色。
#[cfg(target_os = "windows")]
fn inject_alt_modifier(window: &tauri::WebviewWindow, pressed: bool) {
    let pressed_js = if pressed { "true" } else { "false" };
    let script = format!(
        r#"window.dispatchEvent(new CustomEvent("pixelart-alt-modifier", {{ detail: {{ pressed: {pressed_js} }} }}));"#
    );
    let _ = window.eval(&script);
}

#[cfg(target_os = "windows")]
fn watch_alt_key_release(window: tauri::WebviewWindow) {
    std::thread::spawn(move || {
        const VK_MENU: i32 = 0x12;
        loop {
            std::thread::sleep(std::time::Duration::from_millis(16));
            let pressed = unsafe {
                windows_sys::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState(VK_MENU) as u16
                    & 0x8000
                    != 0
            };
            if !pressed {
                inject_alt_modifier(&window, false);
                break;
            }
        }
    });
}

#[cfg(target_os = "windows")]
fn suppress_alt_accelerator(window: &tauri::WebviewWindow) {
    use webview2_com::AcceleratorKeyPressedEventHandler;
    use webview2_com::Microsoft::Web::WebView2::Win32::{
        ICoreWebView2AcceleratorKeyPressedEventArgs, ICoreWebView2Controller,
    };

    // VK_MENU：Alt 键的 Win32 虚拟键码。
    const VK_MENU: u32 = 0x12;

    let window_for_handler = window.clone();
    let _ = window.with_webview(|webview| {
        let controller = webview.controller();
        let handler = AcceleratorKeyPressedEventHandler::create(Box::new(
            move |_controller: Option<ICoreWebView2Controller>,
                  args: Option<ICoreWebView2AcceleratorKeyPressedEventArgs>| {
                if let Some(args) = args {
                    let mut virtual_key: u32 = 0;
                    unsafe {
                        if args.VirtualKey(&mut virtual_key).is_ok() && virtual_key == VK_MENU {
                            // 标记为已处理，阻止 WebView2 把 Alt 转发给宿主窗口激活系统菜单，
                            // 焦点因此保留在 WebView 内，鼠标无需点击即可继续移动/绘制。
                            let _ = args.SetHandled(true);
                            inject_alt_modifier(&window_for_handler, true);
                            watch_alt_key_release(window_for_handler.clone());
                        }
                    }
                }
                Ok(())
            },
        ));
        let mut token = 0i64;
        unsafe {
            let _ = controller.add_AcceleratorKeyPressed(&handler, &mut token);
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_screenshots::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![apply_color_edit, cancel_color_edit])
        .setup(|_app| {
            #[cfg(target_os = "windows")]
            {
                use tauri::Manager;
                if let Some(window) = _app.get_webview_window("main") {
                    suppress_alt_accelerator(&window);
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
