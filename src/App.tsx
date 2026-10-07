/** @format */

import { useEffect, useRef } from "react";
import "./App.scss";
import { startGeneratorCanvasDemo } from "./lib/generatorCanvasDemo";
import { platform } from "./platform/platform";

function App() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

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
			<h1>rcrt-demo</h1>
			<canvas id="demo" ref={canvasRef} />
		</main>
	);
}

export default App;
