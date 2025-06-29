import { BaseComponent } from "../components";
import { MousePoint } from "../types/common";
import { MouseUtils } from "../utils";
import { BaseTool } from "./base-tool";

interface DragRange {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class DragTool extends BaseTool {
  public readonly name = "drag";
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

    this.isDrawing = true;
    this.initPoint = position;
    this.movePoint = position;
  };

  onMouseMove = (e: MouseEvent) => {
    this.movePoint = MouseUtils.getMousePos(e, this.canvas);
  };

  onMouseUp = (e: MouseEvent) => {
    this.isDrawing = false;
    this.initPoint = null;
    this.movePoint = null;
  };

  draw = (): DragRange | null => {
    if (!this.initPoint || !this.movePoint) return null;

    const { x, y } = this.movePoint;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(this.initPoint.x, y);
    this.ctx.lineTo(this.initPoint.x, this.initPoint.y);
    this.ctx.lineTo(x, this.initPoint.y);
    this.ctx.lineTo(x, y);
    this.ctx.fill();
    this.ctx.fillStyle = "rgba(105, 105, 230, 0.1)";
    this.ctx.strokeStyle = "rgba(105, 105, 230)";
    this.ctx.stroke();
    this.ctx.closePath();

    const left = Math.min(x, this.initPoint.x);
    const top = Math.min(y, this.initPoint.y);
    const right = Math.max(x, this.initPoint.x);
    const bottom = Math.max(y, this.initPoint.y);

    return {
      x1: left,
      y1: top,
      x2: right,
      y2: bottom,
    };
  };
}
