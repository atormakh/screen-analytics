#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod log_util;
mod scheduler;
mod screenshot;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            commands::take_screenshot,
            commands::get_screenshots_dir,
            commands::append_activity_line,
            commands::get_activity_log_path,
            commands::open_logs_folder,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();
            let app_data = app.path().app_data_dir()?;
            let screenshots_dir = app_data.join("screenshots");

            log_util::info(
                "startup",
                format!(
                    "scheduler started (capture every 3 min); screenshots dir = {}",
                    screenshots_dir.display()
                ),
            );

            scheduler::start_scheduler(app_handle, screenshots_dir);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
