import { BaseTool } from "./base-tool";

export class LineTool extends BaseTool {
  components: [] = [];

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    super(canvas, ctx);
    this.components = [];
  }

  onMouseDown = (e: MouseEvent) => {};
  onMouseMove = (e: MouseEvent) => {};
  onMouseUp = (e: MouseEvent) => {};

  appendComponent = () => {};
}
