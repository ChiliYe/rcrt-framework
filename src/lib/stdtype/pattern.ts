export interface RealPattern<TFrame, TInput> {
  ctx: CanvasRenderingContext2D;
  frames: Generator<TFrame, void, TInput>;
}

export class Pattern<
  TArgs extends unknown[],
  TFrame,
  TInput,
> {
  constructor(
    private readonly drawMethod: (
      ctx: CanvasRenderingContext2D,
      ...args: TArgs
    ) => Generator<TFrame, void, TInput>,
  ) {}

  create(
    ctx: CanvasRenderingContext2D,
    ...args: TArgs
  ): RealPattern<TFrame, TInput> {
    const frames = this.drawMethod(ctx, ...args);
    frames.next();
    return { ctx, frames };
  }
}
