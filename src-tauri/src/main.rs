#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{error, info, warn};
use once_cell::sync::Lazy;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, RunEvent, State};
use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

static SERVER_PROCESS: Lazy<Mutex<Option<Child>>> = Lazy::new(|| Mutex::new(None));

// State for minimize-to-tray preference
struct MinimizeToTrayState(Arc<Mutex<bool>>);

fn logging_targets() -> Vec<Target> {
    let mut targets = vec![Target::new(TargetKind::LogDir {
        file_name: Some(LOG_FILE_NAME.into()),
    })];

    if cfg!(debug_assertions) {
        targets.push(Target::new(TargetKind::Stdout));
    }

    targets
}

const LOG_FILE_NAME: &str = "main";
const MAX_LOG_FILE_BYTES: u128 = 10 * 1024 * 1024; // 10 MB per file
const SERVER_LOG_FILE: &str = "server";

// Command to update minimize-to-tray preference
#[tauri::command]
fn set_minimize_to_tray(state: State<MinimizeToTrayState>, enabled: bool) {
    if let Ok(mut minimize_to_tray) = state.0.lock() {
        *minimize_to_tray = enabled;
    }
}

// Command to get current minimize-to-tray preference
#[tauri::command]
fn get_minimize_to_tray(state: State<MinimizeToTrayState>) -> bool {
    state.0.lock().map(|guard| *guard).unwrap_or(true)
}

fn spawn_server(app: &AppHandle) -> tauri::Result<()> {
    if cfg!(debug_assertions) {
        // Dev mode runs the server via `pnpm dev` already.
        info!("Development mode detected - backend managed by `pnpm dev`");
        return Ok(());
    }

    info!("Starting production server...");

    let resource_dir = app.path().resource_dir()?;
    let log_dir = app.path().app_log_dir()?;
    std::fs::create_dir_all(&log_dir)?;
    let log_dir_env = log_dir.clone().into_os_string();

    info!("Resource dir: {:?}", resource_dir);
    info!("Log dir: {:?}", log_dir);

    // Server bundle paths
    let server_bundle_dir = resource_dir.join("server-bundle");
    let server_entry = server_bundle_dir.join("dist").join("index.js");
    let node_modules = server_bundle_dir.join("node_modules");

    info!("Using system Node.js");
    info!("Server entry: {:?}", server_entry);
    info!("Node modules dir: {:?}", node_modules);

    // Validate server entry exists
    if !server_entry.exists() {
        error!(
            "Server entry point missing at {:?}. Did the bundle script run?",
            server_entry
        );
        return Err(tauri::Error::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("Server entry point not found at {:?}. Run 'pnpm bundle:server'.", server_entry),
        )));
    }

    if !node_modules.exists() {
        warn!("node_modules not found at {:?}; Node will rely on packaged dependencies", node_modules);
    }

    // Use system Node.js instead of bundled binary
    // Convert paths to avoid UNC prefix issues with Node.js on Windows
    let server_bundle_dir_normalized = dunce::simplified(&server_bundle_dir);
    let server_entry_normalized = dunce::simplified(&server_entry);
    let resource_dir_normalized = dunce::simplified(&resource_dir);

    let mut cmd = Command::new("node");
    cmd.arg(server_entry_normalized)
        .current_dir(server_bundle_dir_normalized)
        .env("PORT", "3000")
        .env("SERVER_HOST", "127.0.0.1")
        .env("SERVER_BASE_URL", "http://127.0.0.1:3000")
        .env("ELECTRON_PACKAGED", "true")
        .env("RESOURCES_PATH", resource_dir_normalized)
        .env("JAMRA_LOG_DIR", log_dir_env)
        .env("JAMRA_LOG_FILE", SERVER_LOG_FILE)
        .env(
            "JAMRA_LOG_LEVEL",
            if cfg!(debug_assertions) { "debug" } else { "info" },
        )
        .env("NODE_ENV", "production")
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());

    if node_modules.exists() {
        if let Some(path_str) = node_modules.to_str() {
            cmd.env("NODE_PATH", path_str);
        }
    }

    info!("Spawning server process...");
    let child = cmd.spawn().map_err(|error| {
        error!("Failed to spawn server: {error}");
        tauri::Error::Io(std::io::Error::new(
            std::io::ErrorKind::Other,
            format!("Failed to spawn server: {}", error),
        ))
    })?;

    let pid = child.id();
    info!("Server started successfully (PID: {})", pid);

    let mut handle = SERVER_PROCESS.lock().expect("mutex poisoned");
    *handle = Some(child);

    Ok(())
}

#[cfg(target_os = "windows")]
fn kill_server() {
    if let Ok(mut guard) = SERVER_PROCESS.lock() {
        if let Some(child) = guard.take() {
            let pid = child.id();
            info!("Terminating server process (PID: {})", pid);
            // Use taskkill for graceful shutdown on Windows
            let _ = Command::new("taskkill")
                .args(&["/PID", &pid.to_string(), "/T"])
                .output();

            // Wait up to 5 seconds for graceful shutdown
            std::thread::sleep(std::time::Duration::from_secs(5));
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn kill_server() {
    if let Ok(mut guard) = SERVER_PROCESS.lock() {
        if let Some(mut child) = guard.take() {
            // Unix: Send SIGTERM for graceful shutdown
            let pid = child.id() as i32;
            info!("Sending SIGTERM to server process (PID: {})", pid);
            unsafe {
                libc::kill(pid, libc::SIGTERM);
            }

            // Wait up to 5 seconds for graceful shutdown
            for _ in 0..50 {
                if child.try_wait().ok().flatten().is_some() {
                    return;
                }
                std::thread::sleep(std::time::Duration::from_millis(100));
            }

            // Force kill if still running
            let _ = child.kill();
            warn!("Server process did not exit gracefully - forced kill issued");
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin({
            let level = if cfg!(debug_assertions) {
                log::LevelFilter::Debug
            } else {
                log::LevelFilter::Info
            };

            tauri_plugin_log::Builder::new()
                .targets(logging_targets())
                .rotation_strategy(RotationStrategy::KeepSome(5))
                .max_file_size(MAX_LOG_FILE_BYTES)
                .level(level)
                .build()
        })
        .setup(|app| {
            let handle = app.handle();

            // Spawn server
            spawn_server(&handle)?;

            // Create tray menu
            let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(
                app,
                &[&show_item, &hide_item, &quit_item],
            )?;

            // Build tray icon with embedded icon
            let _tray = TrayIconBuilder::new()
                .icon(tauri::include_image!("icons/icon.ico"))
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                        "quit" => {
                            kill_server();
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .manage(MinimizeToTrayState(Arc::new(Mutex::new(true)))) // Default to true
        .invoke_handler(tauri::generate_handler![set_minimize_to_tray, get_minimize_to_tray])
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Check minimize-to-tray preference
                    let app = window.app_handle();
                    if let Some(state) = app.try_state::<MinimizeToTrayState>() {
                        if let Ok(minimize_to_tray) = state.0.lock() {
                            if *minimize_to_tray {
                                // Minimize to tray
                                let _ = window.hide();
                                api.prevent_close();
                            } else {
                                // Allow close (which will trigger RunEvent::Exit)
                                // Don't prevent close
                            }
                        }
                    }
                }
                _ => {}
            }
        })
        .build(tauri::generate_context!())
        .expect("error while running JAMRA")
        .run(|_, event| match event {
            RunEvent::Exit | RunEvent::ExitRequested { .. } => {
                kill_server();
            }
            _ => {}
        });
}
