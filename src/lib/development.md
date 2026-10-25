<!-- @format -->

# 开发参考文档

## 跨环境平台函数

业务代码通过 `src/platform.ts` 中的 `platform` 调用平台函数，不直接依赖 Tauri API。该模块使用 `isTauri()` 选择实现：Tauri 环境调用 Rust command，浏览器环境调用 TypeScript 实现。

新增平台函数时，在 `PlatformApi` 中声明签名，并分别补充 `browserImplementation` 与 `tauriImplementation`；Tauri 实现对应的 Rust 函数还需要通过 `tauri::generate_handler!` 注册。调用方始终只使用 `platform`，同一份前端代码即可运行在浏览器和 Tauri 中。

## i18n 多语言规范

项目使用 `i18next` 和 `react-i18next`。语言资源按以下结构存放：

```text
i18n/
  <language>/
    <namespace>.ts
```

`<language>` 使用 BCP 47 语言标签（如 `en`、`zh-CN`）；文件路径（不含扩展名）就是 i18next 命名空间。例如，`i18n/en/demo/greet.ts` 对应语言 `en`、命名空间 `demo/greet`。资源文件默认导出普通对象，翻译键对应字符串值：

```ts
export default {
  title: "Welcome to the demo!",
  language: "Language",
};
```

### 添加翻译键

1. 在相应命名空间的每种已支持语言资源中添加相同的键，保证键名及对象层级一致；值为该语言的翻译文本。
2. 在组件中使用对应命名空间的 `useTranslation`，并通过 `t` 读取键，不要在界面中硬编码需要翻译的文本：

   ```tsx
   const { t } = useTranslation("demo/greet");
   return <h1>{t("title")}</h1>;
   ```

3. 新增命名空间时，在 `src/i18n.ts` 中为每种语言导入对应资源，并将其加入 `resources` 配置。

### 添加语言

1. 在 `i18n/<language>/` 下新增资源文件，为现有命名空间补齐所有翻译键；资源结构应与其他语言完全对应。
2. 在 `src/i18n.ts` 中导入资源，将语言标签加入 `supportedLanguages`，并在 i18next 的 `resources` 配置中注册该语言及其命名空间。
3. 在 `src/App.tsx` 的语言选择器中增加该语言选项。初始化语言由 `src/i18n.ts` 的 `getInitialLanguage` 决定；如需让该语言能根据系统语言自动选中，也应更新该判断逻辑。

语言选择会保存到本地，且当前语言会同步到 HTML 的 `lang` 属性；未知或缺失的翻译会回退到英语。新增语言时也请保持这两个行为不变。

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
>;
```

### 帧生成逻辑

1. 初始化时，调用方创建第一份 `FrameInput`，将 `previousFrame` 设为空对象 `{}`，并将其传给生成器。示例中的画布尺寸和输入控制也在此时初始化。
2. 首次调用 `generator.next()` 时，生成器从初始输入创建 `global` 和 `method`，再使用输入更新内部状态、绘制第一帧，并产出包含 `frameIndex`、`input`、`state` 和 `method` 的结果。示例的第一帧索引从 `0` 开始；`global` 保留在生成器内部。
3. 每次动画帧到来时，调用方构造新的 `FrameInput`：采集时间差、画布尺寸和控制输入，并把上一帧产出的索引与状态放入 `previousFrame`；然后通过 `generator.next(frameInput)` 将其传回生成器。
4. 生成器从上一次 `yield` 处恢复，将收到的参数作为当前输入，并在内部通过 `global` 更新业务状态。示例将时间差限制在 `0` 到 `50` 毫秒，并在物体越界时限制位置并反转速度。
5. 状态更新后，生成器绘制画布并创建本帧的 `state`，再通过 `yield` 产出帧。每次恢复执行后内部帧索引递增；调用方保存本帧索引和状态，供下一帧使用。
6. `method` 由生成器创建并随帧结果返回，供外部调用。示例中的 `method.stop` 会取消动画调度、移除事件监听并结束生成器；仅供生成器使用的辅助逻辑（如位置限制）留在生成器内部，不通过 `method` 暴露。

## rcrt的封装图形

### 种类

#### pattern

图章：用于封装可复用的图案（一般是需要多次修改的）

##### 逻辑

通过一个类 `Pattern` 来操作

创建 `Pattern` 类，接受一个图章生成器并返回一个 `Pattern` 对象。`Pattern` 类只保存生成器，不保存绘制上下文，因此同一个 `Pattern` 对象可用于多个 Canvas。

`Pattern` 对象可通过 `create(ctx, ...args)` 方法配合图章方法预定义的参数创建真实的 Pattern。每次调用都会创建一个独立的真实 Pattern 对象，其中保存该 Canvas 的 `ctx` 和帧迭代器 `frames`；生成器接收 `ctx` 作为第一个参数，其余参数按顺序传入。

`create` 会使用该上下文启动生成器并绘制第一帧，随后返回真实的 Pattern 对象；后续通过其 `frames` 迭代器更新。

#### entity

实体：本质上是一个状态机，会因为外部输入而多次修改，用于玩家、游戏实体等

#### scene

场景：用于在单页面下不变的场景元素

#### uibox

交互盒：用于ui

### 使用

scene和静态的uibox通常不会经常变化，为了提高渲染效率，请一定把他们放在同一个Canvas并和pattern、entity、频繁变化的uibox所在的Canvas分开
