import { BaseTool } from "./base-tool";
import { MousePoint } from "../types";
import { MouseUtils } from "../utils";
import { BaseComponent, Line } from "../components";

export class LineTool extends BaseTool {
  public readonly name = "line";
  private initPoint: MousePoint | null = null;
  private movePoint: MousePoint | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    components: Set<BaseComponent> | null,
    deleteCurrentTool: () => void
  ) {
    super(canvas, ctx, components, deleteCurrentTool);
  }

  onMouseDown = (e: MouseEvent) => {
    const position = MouseUtils.getMousePos(e, this.canvas);

    if (!this.isDrawing) {
      this.isDrawing = true;
      this.initPoint = position;
      this.movePoint = position;
    }
  };

  onMouseMove = (e: MouseEvent) => {
    this.movePoint = MouseUtils.getMousePos(e, this.canvas);
  };

  onMouseUp = (e: MouseEvent) => {
    if (!this.initPoint || !this.movePoint) return;

    const { x: initX, y: initY } = this.initPoint;
    const { x: endX, y: endY } = this.movePoint;

    if (initX === endX && initY === endY) return;

    this.appendComponent(this.initPoint, this.movePoint);
    this.deactivate();
    this.isDrawing = false;
    this.initPoint = null;
    this.movePoint = null;
  };

  draw = () => {
    if (!this.initPoint || !this.movePoint) return;

    this.ctx.beginPath();
    this.ctx.arc(this.initPoint.x, this.initPoint.y, 2, 0, Math.PI * 2);
    this.ctx.fillStyle = "black";
    this.ctx.fill();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.moveTo(this.initPoint.x, this.initPoint.y);
    this.ctx.lineTo(this.movePoint.x, this.movePoint.y);
    this.ctx.strokeStyle = "black";
    this.ctx.stroke();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.arc(this.movePoint.x, this.movePoint.y, 2, 0, Math.PI * 2);
    this.ctx.fillStyle = "black";
    this.ctx.fill();
    this.ctx.closePath();

    return;
  };

  private appendComponent = (init: MousePoint, end: MousePoint) => {
    const { x: initX, y: initY } = init;
    const { x: endX, y: endY } = end;

    const cx = Math.min(initX, endX) + Math.abs(endX - initX) / 2;
    const cy = Math.min(initY, endY) + Math.abs(endY - initY) / 2;

    const line = new Line({
      canvas: this.canvas,
      ctx: this.ctx,
      position: {
        x1: initX,
        y1: initY,
        cx,
        cy,
        x2: endX,
        y2: endY,
      },
    });

    this.components?.add(line);
  };
}
