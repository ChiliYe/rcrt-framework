/** @format */

import { IConsole } from "../type.ts";

export function openLogFile_web(): Promise<IConsole> {
	return Promise.resolve({
		note: () => {},
		warn: () => {},
		error: () => {},
		fetal: () => {},
	});
}
