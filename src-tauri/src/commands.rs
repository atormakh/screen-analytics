use std::io::Write;
use std::path::Path;
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

#[tauri::command]
pub fn append_activity_line(app: AppHandle, json_line: String) -> Result<(), String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let log_dir = app_data.join("logs");
    std::fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;
    let path = log_dir.join("activity.jsonl");
    let mut f = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| e.to_string())?;
    writeln!(f, "{}", json_line).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_activity_log_path(app: AppHandle) -> Result<String, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = app_data.join("logs").join("activity.jsonl");
    Ok(path.to_string_lossy().to_string())
}

fn open_in_file_manager(path: &Path) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(any(
        target_os = "macos",
        target_os = "linux",
        target_os = "windows"
    )))]
    {
        let _ = path;
        return Err("unsupported platform".to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn open_logs_folder(app: AppHandle) -> Result<(), String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let log_dir = app_data.join("logs");
    std::fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;
    open_in_file_manager(&log_dir)
}
