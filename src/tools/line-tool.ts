import { BaseTool } from "./base-tool";

export class LineTool extends BaseTool {
  public readonly name = "line";

  private components: [] = [];

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    super(canvas, ctx);
  }

  onMouseDown = (e: MouseEvent) => {};
  onMouseMove = (e: MouseEvent) => {};
  onMouseUp = (e: MouseEvent) => {};
  draw = () => {};

  appendComponent = () => {};
}
