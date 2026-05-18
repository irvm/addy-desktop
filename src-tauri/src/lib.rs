use tauri::{AppHandle, Manager, Runtime};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri_plugin_keyring::KeyringExt;
use serde_json::json;

const KEYRING_SERVICE: &str = "addy-desktop";
const KEYRING_USER: &str = "api_key";

// Internal helper to retrieve the API key using tauri-plugin-keyring
async fn get_api_key_internal<R: Runtime>(app: &AppHandle<R>) -> Option<String> {
    match app.keyring().get_password(KEYRING_SERVICE, KEYRING_USER) {
        Ok(password) => password,
        Err(_) => None,
    }
}

// Internal helper to make requests to the addy.io API
async fn make_addy_request(api_key: &str, method: reqwest::Method, endpoint: &str, body: Option<serde_json::Value>) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
        
    let url = format!("https://app.addy.io/api/v1/{}", endpoint);
    
    let mut request = client.request(method, &url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("Accept", "application/json");
    
    if let Some(b) = body {
        request = request.json(&b);
    }
    
    let res = request.send().await.map_err(|e| format!("Network error: {}", e))?;
    
    if !res.status().is_success() {
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        return Err(format!("API Error {}: {}", status, text));
    }
    
    if res.status() == 204 {
        return Ok(json!({"success": true}));
    }
    
    let json = res.json::<serde_json::Value>().await.map_err(|e| format!("JSON parse error: {}", e))?;
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
    
    let domains = make_addy_request(&api_key, reqwest::Method::GET, "domains", None).await?;
    let usernames = make_addy_request(&api_key, reqwest::Method::GET, "usernames", None).await?;
    
    Ok(json!({
        "domains": domains["data"],
        "usernames": usernames["data"]
    }))
}

#[tauri::command]
async fn save_api_key(app: AppHandle, api_key: String) -> Result<(), String> {
    // Verify the API key first
    if let Err(e) = make_addy_request(&api_key, reqwest::Method::GET, "account-details", None).await {
        return Err(format!("Invalid API Key: {}", e));
    }

    // Save to system keyring
    app.keyring()
        .set_password(KEYRING_SERVICE, KEYRING_USER, &api_key)
        .map_err(|e| {
            let err_msg = e.to_string();
            if err_msg.contains("not activatable") || err_msg.contains("No such interface") {
                "System Keyring (Secret Service) not found. On Linux, please install 'gnome-keyring' or 'kwallet'.".to_string()
            } else {
                format!("Failed to save to keyring: {}", err_msg)
            }
        })?;
    
    Ok(())
}

#[tauri::command]
async fn logout(app: AppHandle) -> Result<(), String> {
    app.keyring()
        .delete_password(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| format!("Failed to delete from keyring: {}", e))?;
    
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
        make_addy_request(&api_key, reqwest::Method::POST, "active-aliases", Some(json!({"id": id}))).await
    } else {
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
        .plugin(tauri_plugin_keyring::init())
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
            logout,
            create_alias,
            toggle_alias_active,
            delete_alias,
            forget_alias
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
