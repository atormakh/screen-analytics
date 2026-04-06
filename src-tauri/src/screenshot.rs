use std::path::PathBuf;
use std::process::Command;

use chrono::Local;

use crate::log_util;

pub struct CaptureResult {
    pub path: String,
    pub timestamp: String,
}

/// `trigger` describes who asked for the capture (e.g. `"scheduler"`, `"manual"`).
pub fn capture_screenshot(screenshots_dir: &PathBuf, trigger: &str) -> Result<CaptureResult, String> {
    std::fs::create_dir_all(screenshots_dir).map_err(|e| e.to_string())?;

    let now = Local::now();
    let filename = now.format("%Y-%m-%d_%H-%M-%S.png").to_string();
    let filepath = screenshots_dir.join(&filename);
    let timestamp = now.to_rfc3339();

    let filepath_str = filepath
        .to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())?;

    log_util::info(
        "screenshot",
        format!(
            "attempting capture (trigger={trigger}) → {} | command: screencapture -x -D 1",
            filepath.display()
        ),
    );

    // -x: no sound, -D 1: main display (helps some multi-monitor setups)
    let output = Command::new("screencapture")
        .args(["-x", "-D", "1", filepath_str])
        .output()
        .map_err(|e| {
            log_util::info("screenshot", format!("could not spawn screencapture: {e}"));
            format!("Failed to run screencapture: {}", e)
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        log_util::info(
            "screenshot",
            format!(
                "screencapture exited with status {:?}; stderr: {}",
                output.status.code(),
                stderr.trim()
            ),
        );
        let hint = if stderr.contains("could not create image") {
            " On macOS: System Settings → Privacy & Security → Screen Recording → enable Terminal, Cursor, or Screendiary (the app that launched this process), then quit and reopen the app."
        } else {
            ""
        };
        return Err(format!("screencapture failed: {}{}", stderr, hint));
    }

    if !filepath.exists() {
        log_util::info(
            "screenshot",
            "screencapture reported success but output file is missing",
        );
        return Err("Screenshot file was not created".to_string());
    }

    let size = std::fs::metadata(&filepath)
        .map(|m| m.len())
        .unwrap_or(0);
    log_util::info(
        "screenshot",
        format!(
            "ok (trigger={trigger}) → {} ({} bytes)",
            filepath.display(),
            size
        ),
    );

    Ok(CaptureResult {
        path: filepath.to_string_lossy().to_string(),
        timestamp,
    })
}
