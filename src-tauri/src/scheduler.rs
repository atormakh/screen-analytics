use std::path::PathBuf;
use std::time::Duration;

use tauri::{AppHandle, Emitter};

use crate::log_util;
use crate::screenshot::capture_screenshot;

#[derive(Clone, serde::Serialize)]
pub struct SnapshotPayload {
    pub path: String,
    pub timestamp: String,
}

const INTERVAL_SECS: u64 = 180; // 3 minutes

pub fn start_scheduler(app: AppHandle, screenshots_dir: PathBuf) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(INTERVAL_SECS));

        log_util::info(
            "scheduler",
            format!("interval elapsed ({INTERVAL_SECS}s), requesting capture"),
        );

        match capture_screenshot(&screenshots_dir, "scheduler") {
            Ok(result) => {
                log_util::info(
                    "scheduler",
                    format!(
                        "emitting event snapshot-taken for {}",
                        result.path
                    ),
                );
                let payload = SnapshotPayload {
                    path: result.path,
                    timestamp: result.timestamp,
                };
                if let Err(e) = app.emit("snapshot-taken", payload) {
                    log_util::info("scheduler", format!("failed to emit snapshot-taken: {e}"));
                }
            }
            Err(e) => {
                log_util::info("scheduler", format!("capture failed: {e}"));
            }
        }
    });
}
