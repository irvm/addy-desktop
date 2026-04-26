use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_store::StoreExt;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use serde_json::json;

async fn get_api_key_internal<R: Runtime>(app: &AppHandle<R>) -> Option<String> {
    let store = app.store("settings.json").ok()?;
    store.get("api_key").and_then(|v| v.as_str().map(|s| s.to_string()))
}

async fn make_addy_request(api_key: &str, method: reqwest::Method, endpoint: &str, body: Option<serde_json::Value>) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("https://app.addy.io/api/v1/{}", endpoint);
    
    let mut request = client.request(method, &url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("Accept", "application/json");
    
    if let Some(b) = body {
        request = request.json(&b);
    }
    
    let res = request.send().await.map_err(|e| e.to_string())?;
    
    if res.status() == 204 {
        return Ok(json!({"success": true}));
    }
    
    let json = res.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
    Ok(json)
}

#[tauri::command]
async fn get_stats(app: AppHandle) -> Result<serde_json::Value, String> {
    let api_key = get_api_key_internal(&app).await.ok_or("No API key found")?;
    make_addy_request(&api_key, reqwest::Method::GET, "account-details", None).await
}

#[tauri::command]
async fn get_aliases(app: AppHandle) -> Result<serde_json::Value, String> {
    let api_key = get_api_key_internal(&app).await.ok_or("No API key found")?;
    make_addy_request(&api_key, reqwest::Method::GET, "aliases", None).await
}

#[tauri::command]
async fn get_available_domains(app: AppHandle) -> Result<serde_json::Value, String> {
    let api_key = get_api_key_internal(&app).await.ok_or("No API key found")?;
    
    // Fetch both shared domains and user's custom domains/usernames
    let domains = make_addy_request(&api_key, reqwest::Method::GET, "domains", None).await?;
    let usernames = make_addy_request(&api_key, reqwest::Method::GET, "usernames", None).await?;
    
    Ok(json!({
        "domains": domains["data"],
        "usernames": usernames["data"]
    }))
}

#[tauri::command]
async fn save_api_key(app: AppHandle, api_key: String) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set("api_key", serde_json::Value::String(api_key));
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn create_alias(app: AppHandle, domain: String, description: Option<String>) -> Result<serde_json::Value, String> {
    let api_key = get_api_key_internal(&app).await.ok_or("No API key found")?;
    let body = json!({
        "domain": domain,
        "description": description.unwrap_or_default(),
        "format": "random_characters"
    });
    make_addy_request(&api_key, reqwest::Method::POST, "aliases", Some(body)).await
}

#[tauri::command]
async fn toggle_alias_active(app: AppHandle, id: String, active: bool) -> Result<serde_json::Value, String> {
    let api_key = get_api_key_internal(&app).await.ok_or("No API key found")?;
    if active {
        // Activate
        make_addy_request(&api_key, reqwest::Method::POST, "active-aliases", Some(json!({"id": id}))).await
    } else {
        // Deactivate
        let endpoint = format!("active-aliases/{}", id);
        make_addy_request(&api_key, reqwest::Method::DELETE, &endpoint, None).await
    }
}

#[tauri::command]
async fn delete_alias(app: AppHandle, id: String) -> Result<serde_json::Value, String> {
    let api_key = get_api_key_internal(&app).await.ok_or("No API key found")?;
    let endpoint = format!("aliases/{}", id);
    make_addy_request(&api_key, reqwest::Method::DELETE, &endpoint, None).await
}

#[tauri::command]
async fn forget_alias(app: AppHandle, id: String) -> Result<serde_json::Value, String> {
    let api_key = get_api_key_internal(&app).await.ok_or("No API key found")?;
    let endpoint = format!("aliases/{}/forget", id);
    make_addy_request(&api_key, reqwest::Method::DELETE, &endpoint, None).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_stats, 
            get_aliases, 
            get_available_domains,
            save_api_key, 
            create_alias,
            toggle_alias_active,
            delete_alias,
            forget_alias
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
