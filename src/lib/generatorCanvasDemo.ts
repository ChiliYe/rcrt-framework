/** @format */

export interface FrameInput {
	deltaMs: number;
	width: number;
	height: number;
	moveX: number;
	moveY: number;
	previousFrame: PreviousFrameInfo | EmptyFrameInfo;
}

export type EmptyFrameInfo = Record<string, never>;

export interface PreviousFrameInfo {
	frameIndex: number;
	state: BouncingBallState;
}

export interface CanvasDemoConfig {
	colors: {
		background: string;
		ball: string;
		text: string;
	};
	sizes: {
		ballRadius: number;
		textFontSize: number;
	};
}

export const defaultCanvasDemoConfig: CanvasDemoConfig = {
	colors: {
		background: "#17211d",
		ball: "#f2c14e",
		text: "#e8eee9",
	},
	sizes: {
		ballRadius: 18,
		textFontSize: 14,
	},
};

export interface BouncingBallState {
	x: number;
	y: number;
	velocityX: number;
	velocityY: number;
	radius: number;
	elapsedSeconds: number;
}

export interface CanvasGlobal {
	frameIndex: number;
	elapsedSeconds: number;
	positionX: number;
	positionY: number;
	velocityX: number;
	velocityY: number;
}

export interface CanvasFrameMethods {
	stop: () => void;
}

export interface CanvasFrame {
	frameIndex: number;
	input: FrameInput;
	state: BouncingBallState;
	method: CanvasFrameMethods;
}

export function* createBouncingBallFrames(
	context: CanvasRenderingContext2D,
	config: CanvasDemoConfig,
	initialInput: FrameInput,
	stop: () => void,
): Generator<CanvasFrame, void, FrameInput> {
	const radius = config.sizes.ballRadius;
	const global: CanvasGlobal = {
		frameIndex: 0,
		elapsedSeconds: 0,
		positionX: initialInput.width / 2,
		positionY: initialInput.height / 2,
		velocityX: 180,
		velocityY: 130,
	};
	const method: CanvasFrameMethods = { stop };
	const clamp = (value: number, min: number, max: number) =>
		Math.min(Math.max(value, min), max);
	let input = initialInput;

	while (true) {
		const deltaSeconds =
			Math.min(Math.max(input.deltaMs, 0), 50) / 1000;
		const maxX = Math.max(radius, input.width - radius);
		const maxY = Math.max(
			radius,
			input.height - radius,
		);

		global.elapsedSeconds += deltaSeconds;
		global.positionX +=
			(global.velocityX + input.moveX * 240) * deltaSeconds;
		global.positionY +=
			(global.velocityY + input.moveY * 240) * deltaSeconds;

		if (global.positionX < radius || global.positionX > maxX) {
			global.positionX = clamp(global.positionX, radius, maxX);
			global.velocityX *= -1;
		}

		if (global.positionY < radius || global.positionY > maxY) {
			global.positionY = clamp(global.positionY, radius, maxY);
			global.velocityY *= -1;
		}

		context.clearRect(0, 0, input.width, input.height);
		context.fillStyle = config.colors.background;
		context.fillRect(0, 0, input.width, input.height);

		context.beginPath();
		context.arc(
			global.positionX,
			global.positionY,
			radius,
			0,
			Math.PI * 2,
		);
		context.fillStyle = config.colors.ball;
		context.fill();

		context.fillStyle = config.colors.text;
		context.font = `${config.sizes.textFontSize}px monospace`;
		context.fillText(
			`Generator frame: ${global.elapsedSeconds.toFixed(2)}s`,
			16,
			26,
		);

		const state: BouncingBallState = {
			x: global.positionX,
			y: global.positionY,
			velocityX: global.velocityX,
			velocityY: global.velocityY,
			radius,
			elapsedSeconds: global.elapsedSeconds,
		};
		input = yield {
			frameIndex: global.frameIndex,
			input,
			state,
			method,
		};
		global.frameIndex += 1;
	}
}

export function startGeneratorCanvasDemo(
	canvas: HTMLCanvasElement,
	onFrame?: (frame: CanvasFrame) => void,
	config: CanvasDemoConfig = defaultCanvasDemoConfig,
): () => void {
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error(
			"Canvas 2D context is not available.",
		);
	}

	if (canvas.width === 300 && canvas.height === 150) {
		canvas.width = 640;
		canvas.height = 360;
	}

	const pressedKeys = new Set<string>();
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.code.startsWith("Arrow"))
			event.preventDefault();
		pressedKeys.add(event.code);
	};
	const onKeyUp = (event: KeyboardEvent) =>
		pressedKeys.delete(event.code);
	const onWindowBlur = () => pressedKeys.clear();

	window.addEventListener("keydown", onKeyDown);
	window.addEventListener("keyup", onKeyUp);
	window.addEventListener("blur", onWindowBlur);

	const emptyFrameInfo: EmptyFrameInfo = {};
	let running = true;
	let animationId = 0;
	let frames: Generator<CanvasFrame, void, FrameInput> | undefined;
	const stop = () => {
		if (!running) return;
		running = false;
		cancelAnimationFrame(animationId);
		window.removeEventListener("keydown", onKeyDown);
		window.removeEventListener("keyup", onKeyUp);
		window.removeEventListener("blur", onWindowBlur);
		frames?.return();
	};
	const initialInput: FrameInput = {
		deltaMs: 0,
		width: canvas.width,
		height: canvas.height,
		moveX: 0,
		moveY: 0,
		previousFrame: emptyFrameInfo,
	};
	frames = createBouncingBallFrames(
		context,
		config,
		initialInput,
		stop,
	);
	const initialFrame = frames.next();
	let previousFrame: PreviousFrameInfo | EmptyFrameInfo =
		emptyFrameInfo;
	if (!initialFrame.done) {
		onFrame?.(initialFrame.value);
		previousFrame = {
			frameIndex: initialFrame.value.frameIndex,
			state: initialFrame.value.state,
		};
	}

	let previousTime = 0;

	const tick = (timestamp: number) => {
		if (!running) return;

		const frameInput: FrameInput = {
			deltaMs:
				previousTime === 0
					? 0
					: timestamp - previousTime,
			width: canvas.width,
			height: canvas.height,
			moveX:
				Number(pressedKeys.has("ArrowRight")) -
				Number(pressedKeys.has("ArrowLeft")),
			moveY:
				Number(pressedKeys.has("ArrowDown")) -
				Number(pressedKeys.has("ArrowUp")),
			previousFrame,
		};
		previousTime = timestamp;

		const result = frames?.next(frameInput);
		if (result && !result.done) {
			onFrame?.(result.value);
			previousFrame = {
				frameIndex: result.value.frameIndex,
				state: result.value.state,
			};
		}

		if (running) animationId = requestAnimationFrame(tick);
	};

	if (running) animationId = requestAnimationFrame(tick);

	return stop;
}
