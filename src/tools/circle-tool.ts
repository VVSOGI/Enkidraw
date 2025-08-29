import { MousePoint, STYLE_SYSTEM } from "..";
import { Circle } from "../components";
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
    if (!this.isDrawing) {
      this.isDrawing = true;
      this.initPoint = position;
      this.movePoint = position;
    } else {
      this.isDrawing = false;
    }
  };

  onMouseMove = (e: MouseEvent) => {
    if (!this.isDrawing) return;

    const position = this.getLogicalMousePos(e);
    this.movePoint = position;
  };

  onMouseUp = (e: MouseEvent) => {
    if (!this.initPoint || !this.movePoint) return;

    const { x: startX, y: startY } = this.initPoint;
    const { x: endX, y: endY } = this.movePoint;

    if (startX === endX && startY === endY) {
      return;
    }

    this.isDrawing = false;
    this.appendComponent(this.initPoint, this.movePoint);
    this.deactivate();
  };

  onKeyDown = (e: KeyboardEvent) => {};

  draw = () => {
    if (!this.initPoint || !this.movePoint) return;

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

  addEventListeners = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("keydown", this.onKeyDown);
  };

  removeEventListeners = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("keydown", this.onKeyDown);
  };

  private appendComponent = (start: MousePoint, end: MousePoint) => {
    const { x: startX, y: startY } = start;
    const { x: endX, y: endY } = end;
    const radiusX = Math.abs((endX - startX) / 2);
    const radiusY = Math.abs((endY - startY) / 2);

    const position = {
      x1: Math.min(startX, endX),
      y1: Math.min(startY, endY),
      x2: Math.max(startX, endX),
      y2: Math.max(startY, endY),
    };

    const circle = new Circle({
      canvas: this.canvas,
      ctx: this.ctx,
      position,
      getZoomTransform: this.getZoomTransform,
    });

    this.componentManager.add(circle);
  };
}
