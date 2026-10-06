/** @format */

import { invoke, isTauri } from "@tauri-apps/api/core";

//导入类型文件
import { IConsole } from "./type.ts";

//导入tauri下的模块
import { openLogFile_tauri } from "./tauri/log";

//导入web下的模块
import { openLogFile_web } from "./web/log";

export interface PlatformApi {
	greet(name: string): Promise<string>;

	openLogFile(): Promise<IConsole>;
}

const browserImplementation: PlatformApi = {
	async greet(name) {
		return `Hello, ${name}! You've been greeted from TypeScript in the browser!`;
	},
	openLogFile: openLogFile_web,
};

const tauriImplementation: PlatformApi = {
	async greet(name) {
		return invoke<string>("greet", { name });
	},
	openLogFile: openLogFile_tauri,
};

export const platform: PlatformApi = isTauri()
	? tauriImplementation
	: browserImplementation;
