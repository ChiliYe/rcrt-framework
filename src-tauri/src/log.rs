use std::{
    fs::File,
    io::Write,
    sync::{Arc, Mutex},
};
use std::path::PathBuf;


use serde::{Deserialize, Serialize};
use tauri::State;

/// 返回给前端的日志信息；文件句柄仅保留在 Rust 后端。
#[derive(Clone, Serialize)]
pub struct OpenedLogType {
    pub path: String,
    #[serde(skip)]
    log: Option<Arc<Mutex<File>>>,
}

/// Tauri 应用级状态，供各个命令共享同一个日志文件。
#[derive(Default)]
pub struct LogState {
    opened_log: Mutex<Option<OpenedLogType>>,
}

/// 前端可请求写入的日志级别。
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum LogLevel {
    Note,
    Warn,
    Error,
    Fetal,
}

/// 将不同级别的消息写入已打开的日志文件。
pub struct IConsole;

impl IConsole {
    /// 统一处理加锁、生成时间戳和写入日志的流程。
    fn write(log: &OpenedLogType, level: &str, message: &str) -> Result<(), String> {
        let file = log
            .log
            .as_ref()
            .ok_or_else(|| "Log file is not opened.".to_string())?;
        let mut file = file
            .lock()
            .map_err(|error| format!("Failed to lock log file: {error}"))?;
        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");

        writeln!(file, "[{level}] {timestamp} {message}")
            .map_err(|error| format!("Failed to write to log file: {error}"))
    }

    /// 写入普通提示级别的日志。
    pub fn note(log: OpenedLogType, message: &str) -> Result<(), String> {
        Self::write(&log, "NOTE", message)
    }

    /// 写入警告级别的日志。
    pub fn warn(log: OpenedLogType, message: &str) -> Result<(), String> {
        Self::write(&log, "WARN", message)
    }

    /// 写入错误级别的日志，但不主动终止程序。
    pub fn error(log: OpenedLogType, message: &str) -> Result<(), String> {
        Self::write(&log, "ERROR", message)
    }

    /// 先记录致命错误，再触发 panic 终止当前执行。
    pub fn fetal_error(log: OpenedLogType, message: &str) -> Result<(), String> {
        Self::write(&log, "FETAL ERROR", message)?;
        panic!("FETAL ERROR: {message}");
    }
}

/// 打开或复用日志文件，并返回可序列化的日志信息给前端。
#[tauri::command]
pub fn open_log_file(state: State<'_, LogState>) -> Result<OpenedLogType, String> {
    let mut opened_log = state
        .opened_log
        .lock()
        .map_err(|error| format!("Failed to lock log state: {error}"))?;

    
    // 若日志文件已创建，直接复用当前状态，避免重复打开文件。
    if let Some(log) = opened_log.as_ref() {
        return Ok(log.clone());
    }
    
    let timestamp = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
    let mut log_dir = PathBuf::from("Logs");
    let dir_name = format!("{timestamp}.log");
    log_dir.push(&dir_name);
    let path = format!("{}",log_dir.to_string_lossy());
    std::fs::create_dir_all("Logs").map_err(|error| format!("Failed to create log directory: {error}"))?;
    let file = File::create(&path)
        .map_err(|error| format!("Failed to create log file at {path}: {error}"))?;
    let log = OpenedLogType {
        path,
        log: Some(Arc::new(Mutex::new(file))),
    };

    // 保存后端文件句柄；返回值的序列化会跳过该句柄字段。
    *opened_log = Some(log.clone());
    Ok(log)
}

/// 将前端传入的消息写入当前日志文件。
#[tauri::command]
pub fn write_log(
    level: LogLevel,
    message: String,
    state: State<'_, LogState>,
) -> Result<(), String> {
    // 只复制共享句柄的 Arc，避免在写文件期间占用状态锁。
    let log = state
        .opened_log
        .lock()
        .map_err(|error| format!("Failed to lock log state: {error}"))?
        .clone()
        .ok_or_else(|| "Log file is not opened.".to_string())?;

    match level {
        LogLevel::Note => IConsole::note(log, &message),
        LogLevel::Warn => IConsole::warn(log, &message),
        LogLevel::Error => IConsole::error(log, &message),
        LogLevel::Fetal => IConsole::fetal_error(log, &message),
    }
}
