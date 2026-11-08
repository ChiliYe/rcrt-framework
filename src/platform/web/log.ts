/** @format */

import { IConsole } from "../type.ts";

export function openLogFile_web(): Promise<IConsole> {
	return Promise.resolve({
		path: "",
		note: async () => {},
		warn: async () => {},
		error: async () => {},
		fetal: async () => {},
	});
}
