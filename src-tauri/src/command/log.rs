#[tauri::command]
pub fn open_log_file() -> Result<IConsole, String> {
    // 这里可以实现打开日志文件的逻辑
    // 例如，读取日志文件内容并返回给前端
    // 这里我们简单返回一个示例的 IConsole 对象
    Ok(IConsole {
        log: "This is a log message.".to_string(),
        error: "This is an error message.".to_string(),
    })
}