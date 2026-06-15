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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
