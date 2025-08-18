import { MousePoint, STYLE_SYSTEM } from "..";
import { BaseTool, BaseToolProps } from "./base-tool";

export class CircleTool extends BaseTool {
  name: string = "circle-tool";
  private initPoint: MousePoint | null = null;
  private movePoint: MousePoint | null = null;

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

  onMouseDown = (e: MouseEvent) => {
    const position = this.getLogicalMousePos(e);
    this.isDrawing = true;
    this.initPoint = position;
    this.movePoint = position;
  };

  onMouseMove = (e: MouseEvent) => {
    if (!this.isDrawing) return;

    const position = this.getLogicalMousePos(e);
    this.movePoint = position;
  };

  onMouseUp = (e: MouseEvent) => {
    if (!this.isDrawing || !this.initPoint || !this.movePoint) return;

    const { x: startX, y: startY } = this.initPoint;
    const { x: endX, y: endY } = this.movePoint;

    if (startX === endX && startY === endY) {
      return;
    }

    this.deactivate();
  };

  onKeyDown = (e: KeyboardEvent) => {};

  draw = () => {
    if (!this.isDrawing || !this.initPoint || !this.movePoint) return;

    const { x: startX, y: startY } = this.initPoint;
    const { x: endX, y: endY } = this.movePoint;
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    const radiusX = Math.abs((endX - startX) / 2);
    const radiusY = Math.abs((endY - startY) / 2);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = STYLE_SYSTEM.STROKE_WIDTH;
    this.ctx.strokeStyle = "black";
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  reset = () => {
    this.initPoint = null;
    this.movePoint = null;
  };

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
