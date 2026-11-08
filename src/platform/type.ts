/** @format */

export interface IConsole {
	/** 日志文件在后端创建或复用后的路径。 */
	path: string;
	note(message: string): Promise<void>;
	warn(message: string): Promise<void>;
	error(message: string): Promise<void>;
	fetal(message: string): Promise<void>;
}
