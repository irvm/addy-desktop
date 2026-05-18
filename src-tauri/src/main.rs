// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Fix for Linux WebKitGTK rendering glitches (transparency, terminal showing through)
    // Disabling DMABUF renderer is the first line of defense.
    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    
    // Disabling HW acceleration can fix persistent artifacts.
    // We use the Tauri-specific variable which is often more effective.
    std::env::set_var("TAURI_LINUX_DISABLE_HW_ACCELERATION", "1");
    
    tauri_app_lib::run()
}
