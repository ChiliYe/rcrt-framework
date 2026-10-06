/** @format */

export interface FrameInput {
	deltaMs: number;
	width: number;
	height: number;
	moveX: number;
	moveY: number;
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

export interface CanvasFrame {
	input: FrameInput;
	state: BouncingBallState;
}

export function* createBouncingBallFrames(
	context: CanvasRenderingContext2D,
	config: CanvasDemoConfig,
	initialInput: FrameInput,
): Generator<CanvasFrame, void, FrameInput> {
	const radius = config.sizes.ballRadius;
	let positionX = initialInput.width / 2;
	let positionY = initialInput.height / 2;
	let velocityX = 180;
	let velocityY = 130;
	let elapsedSeconds = 0;
	let input = initialInput;

	while (true) {
		const deltaSeconds =
			Math.min(Math.max(input.deltaMs, 0), 50) / 1000;
		const maxX = Math.max(radius, input.width - radius);
		const maxY = Math.max(
			radius,
			input.height - radius,
		);

		elapsedSeconds += deltaSeconds;
		positionX +=
			(velocityX + input.moveX * 240) * deltaSeconds;
		positionY +=
			(velocityY + input.moveY * 240) * deltaSeconds;

		if (positionX < radius || positionX > maxX) {
			positionX = Math.min(
				Math.max(positionX, radius),
				maxX,
			);
			velocityX *= -1;
		}

		if (positionY < radius || positionY > maxY) {
			positionY = Math.min(
				Math.max(positionY, radius),
				maxY,
			);
			velocityY *= -1;
		}

		context.clearRect(0, 0, input.width, input.height);
		context.fillStyle = config.colors.background;
		context.fillRect(0, 0, input.width, input.height);

		context.beginPath();
		context.arc(
			positionX,
			positionY,
			radius,
			0,
			Math.PI * 2,
		);
		context.fillStyle = config.colors.ball;
		context.fill();

		context.fillStyle = config.colors.text;
		context.font = `${config.sizes.textFontSize}px monospace`;
		context.fillText(
			`Generator frame: ${elapsedSeconds.toFixed(2)}s`,
			16,
			26,
		);

		const state: BouncingBallState = {
			x: positionX,
			y: positionY,
			velocityX,
			velocityY,
			radius,
			elapsedSeconds,
		};
		input = yield { input, state };
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

	const initialInput: FrameInput = {
		deltaMs: 0,
		width: canvas.width,
		height: canvas.height,
		moveX: 0,
		moveY: 0,
	};
	const frames = createBouncingBallFrames(
		context,
		config,
		initialInput,
	);
	const initialFrame = frames.next();
	if (!initialFrame.done) onFrame?.(initialFrame.value);

	let running = true;
	let previousTime = 0;
	let animationId = 0;

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
		};
		previousTime = timestamp;

		const result = frames.next(frameInput);
		if (!result.done) onFrame?.(result.value);

		animationId = requestAnimationFrame(tick);
	};

	animationId = requestAnimationFrame(tick);

	return () => {
		running = false;
		cancelAnimationFrame(animationId);
		window.removeEventListener("keydown", onKeyDown);
		window.removeEventListener("keyup", onKeyUp);
		window.removeEventListener("blur", onWindowBlur);
		frames.return();
	};
}
