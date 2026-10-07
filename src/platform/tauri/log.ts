/** @format */

import { invoke } from "@tauri-apps/api/core";
import type { IConsole } from "../type.ts";

export function openLogFile_tauri(): Promise<IConsole> {
	return invoke<{ path: string }>("open_log_file").then(({ path }) => ({
		path,
		note: (message) => invoke<void>("write_log", { level: "note", message }),
		warn: (message) => invoke<void>("write_log", { level: "warn", message }),
		error: (message) => invoke<void>("write_log", { level: "error", message }),
		fetal: (message) => invoke<void>("write_log", { level: "fetal", message }),
	}));
}
