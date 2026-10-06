/** @format */

import { invoke } from "@tauri-apps/api/core";
import { IConsole } from "../type.ts";

export function openLogFile_tauri(): Promise<IConsole> {
	// 打开日志文件（逻辑由后端完成）
	return invoke<IConsole>("open_log_file");
}
