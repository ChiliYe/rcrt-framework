<!-- @format -->

# 开发参考文档

## 跨环境平台函数

业务代码通过 `src/platform.ts` 中的 `platform` 调用平台函数，不直接依赖 Tauri API。该模块使用 `isTauri()` 选择实现：Tauri 环境调用 Rust command，浏览器环境调用 TypeScript 实现。

新增平台函数时，在 `PlatformApi` 中声明签名，并分别补充 `browserImplementation` 与 `tauriImplementation`；Tauri 实现对应的 Rust 函数还需要通过 `tauri::generate_handler!` 注册。调用方始终只使用 `platform`，同一份前端代码即可运行在浏览器和 Tauri 中。

## 生成器编写规范

开发者编写生成器函数时，应将每一帧视为一次“接收输入、更新状态、产出结果”的迭代。可参考 [`generatorCanvasDemo.ts`](./generatorCanvasDemo.ts) 中的弹跳球示例。

### 类型接口

类型接口只约定生成器迭代所需的结构；每个生成器的业务输入、状态、全局信息和方法由实现方定义，并作为泛型参数传入：

```ts
export type EmptyFrameInfo = Record<string, never>;

export type FrameInput<
	TInput extends object,
	TPreviousFrame extends object,
> = TInput & {
	previousFrame: TPreviousFrame;
};

export interface PreviousFrameInfo<TState> {
	frameIndex: number;
	state: TState;
}

export interface GeneratorFrame<
	TInput extends object,
	TPreviousFrame extends object,
	TState,
	TMethod extends object,
> {
	frameIndex: number;
	input: FrameInput<TInput, TPreviousFrame>;
	state: TState;
	method: TMethod;
}
```

`TInput` 和 `TState` 分别表示实现方定义的帧输入和状态；上一帧信息可使用 `PreviousFrameInfo<TState>`，首帧则使用 `EmptyFrameInfo`。`global` 是生成器内部的业务状态对象，由生成器创建和维护，不放入产出帧；生成器也在内部创建 `method`，并通过产出帧将其提供给外部。`TMethod` 由具体生成器定义，不在通用接口中预设业务方法。

生成器类型应明确产出值、结束值和恢复执行时接收的输入：

```ts
Generator<
	GeneratorFrame<TInput, TPreviousFrame, TState, TMethod>,
	void,
	FrameInput<TInput, TPreviousFrame>
>
```

### 帧生成逻辑

1. 初始化时，调用方创建第一份 `FrameInput`，将 `previousFrame` 设为空对象 `{}`，并将其传给生成器。示例中的画布尺寸和输入控制也在此时初始化。
2. 首次调用 `generator.next()` 时，生成器从初始输入创建 `global` 和 `method`，再使用输入更新内部状态、绘制第一帧，并产出包含 `frameIndex`、`input`、`state` 和 `method` 的结果。示例的第一帧索引从 `0` 开始；`global` 保留在生成器内部。
3. 每次动画帧到来时，调用方构造新的 `FrameInput`：采集时间差、画布尺寸和控制输入，并把上一帧产出的索引与状态放入 `previousFrame`；然后通过 `generator.next(frameInput)` 将其传回生成器。
4. 生成器从上一次 `yield` 处恢复，将收到的参数作为当前输入，并在内部通过 `global` 更新业务状态。示例将时间差限制在 `0` 到 `50` 毫秒，并在物体越界时限制位置并反转速度。
5. 状态更新后，生成器绘制画布并创建本帧的 `state`，再通过 `yield` 产出帧。每次恢复执行后内部帧索引递增；调用方保存本帧索引和状态，供下一帧使用。
6. `method` 由生成器创建并随帧结果返回，供外部调用。示例中的 `method.stop` 会取消动画调度、移除事件监听并结束生成器；仅供生成器使用的辅助逻辑（如位置限制）留在生成器内部，不通过 `method` 暴露。
