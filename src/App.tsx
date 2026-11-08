/** @format */

import { useEffect, useRef } from "react";
import "./App.scss";
import { startGeneratorCanvasDemo } from "./lib/generatorCanvasDemo";
import { platform } from "./platform/platform";
import { useTranslation } from "react-i18next";

function App() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const { t, i18n } = useTranslation("demo/greet");

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		return startGeneratorCanvasDemo(canvas);
	}, []);

	platform.openLogFile().then((console) => {
		console.note("日志文件已创建或复用。");
	});

	platform.openLogFile().then((console) => {
		console.warn("日志文件……哦没问题。");
	});
	platform.openLogFile().then((console) => {
		console.error("日志文件……就当有问题了。");
	});

	setTimeout(() => {
		platform.openLogFile().then((console) => {
			console.fetal("模拟崩溃！");
		});
	}, 10000);

	return (
		<main className="container">
			<div className="language-picker">
				<label htmlFor="language">{t("language")}</label>
				<select
					id="language"
					value={i18n.resolvedLanguage ?? "en"}
					onChange={(event) => {
						void i18n.changeLanguage(event.target.value);
					}}
				>
					<option value="en">English</option>
					<option value="zh-CN">简体中文</option>
				</select>
			</div>
			<h1>{t("title")}</h1>
			<canvas id="demo" ref={canvasRef} />
		</main>
	);
}

export default App;
