// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod log;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(log::LogState::default())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            log::open_log_file,
            log::write_log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
