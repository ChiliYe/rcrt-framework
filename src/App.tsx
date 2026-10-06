/** @format */

import { useEffect, useRef } from "react";
import "./App.scss";
import { startGeneratorCanvasDemo } from "./lib/generatorCanvasDemo";

function App() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		return startGeneratorCanvasDemo(canvas);
	}, []);

	return (
		<main className="container">
			<h1>rcrt-demo</h1>
			<canvas id="demo" ref={canvasRef} />
		</main>
	);
}

export default App;
