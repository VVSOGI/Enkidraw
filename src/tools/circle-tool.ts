import { BaseTool, BaseToolProps } from "./base-tool";

export class CircleTool extends BaseTool {
  name: string = "circle-tool";

  constructor({
    canvas,
    ctx,
    activeManager,
    componentManager,
    selectTool,
    deleteCurrentTool,
    getZoomTransform,
  }: BaseToolProps) {
    super({ canvas, ctx, activeManager, componentManager, selectTool, deleteCurrentTool, getZoomTransform });
  }

  onKeyDown = (e: KeyboardEvent) => {};
  onMouseDown = (e: MouseEvent) => {};
  onMouseMove = (e: MouseEvent) => {};
  onMouseUp = (e: MouseEvent) => {};
  draw = (...props: any) => {};
  reset = () => {};

  protected addEventListeners = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("keydown", this.onKeyDown);
  };

  protected removeEventListeners = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("keydown", this.onKeyDown);
  };
}
