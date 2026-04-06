use chrono::Local;

/// Logs to stderr (visible in the terminal where `bun tauri dev` runs).
pub fn info(scope: &str, msg: impl std::fmt::Display) {
    let ts = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
    eprintln!("[screendiary {ts}] [{scope}] {msg}");
}
