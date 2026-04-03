use std::path::PathBuf;

use tauri::{AppHandle, Emitter, Manager};

use crate::log_util;
use crate::scheduler::SnapshotPayload;
use crate::screenshot::capture_screenshot;

fn get_screenshots_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(app_data.join("screenshots"))
}

#[tauri::command]
pub fn take_screenshot(app: AppHandle) -> Result<SnapshotPayload, String> {
    log_util::info("command", "take_screenshot invoked from UI");
    let screenshots_dir = get_screenshots_path(&app)?;
    let result = capture_screenshot(&screenshots_dir, "manual")?;

    let payload = SnapshotPayload {
        path: result.path,
        timestamp: result.timestamp,
    };
    let _ = app.emit("snapshot-taken", payload.clone());

    Ok(payload)
}

#[tauri::command]
pub fn get_screenshots_dir(app: AppHandle) -> Result<String, String> {
    let dir = get_screenshots_path(&app)?;
    Ok(dir.to_string_lossy().to_string())
}
