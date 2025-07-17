import { BaseTool } from "./base-tool";
import { MousePoint } from "../types";
import { MouseUtils } from "../utils";
import { Line } from "../components";
import { ActiveManager, ComponentManager, LeftMenuManager } from "../managers";

export class LineTool extends BaseTool {
  public readonly name = "line";
  private initPoint: MousePoint | null = null;
  private movePoint: MousePoint | null = null;
  private multiPointDrawMode: boolean = false;
  private points: MousePoint[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    componentManager: ComponentManager,
    activeManager: ActiveManager,
    deleteCurrentTool: () => void,
    leftMenuManager: LeftMenuManager
  ) {
    super(canvas, ctx, componentManager, activeManager, deleteCurrentTool, leftMenuManager);
  }

  private reset = () => {
    this.isDrawing = false;
    this.initPoint = null;
    this.movePoint = null;
    this.multiPointDrawMode = false;
    this.points = [];
  };

  onMouseDown = (e: MouseEvent) => {
    const position = MouseUtils.getMousePos(e, this.canvas);

    if (!this.isDrawing) {
      this.isDrawing = true;
      this.initPoint = position;
      this.movePoint = position;
      this.points.push(this.initPoint);
    }
  };

  onMouseMove = (e: MouseEvent) => {
    this.movePoint = MouseUtils.getMousePos(e, this.canvas);
  };

  onMouseUp = (e: MouseEvent) => {
    if (!this.initPoint || !this.movePoint) return;

    const { x: initX, y: initY } = this.initPoint;
    const { x: endX, y: endY } = this.movePoint;

    if (Math.abs(initX - endX) <= 10 && Math.abs(initY - endY) <= 10) {
      this.multiPointDrawMode = true;
      return;
    }

    if (this.multiPointDrawMode) {
      this.points.push(this.movePoint);
    } else {
      this.appendLineComponent();
      this.deactivate();
      this.reset();
    }
  };

  onKeyDown = (e: KeyboardEvent) => {
    if (this.isActive && (e.key === "Esc" || e.key === "Escape")) {
      if (this.multiPointDrawMode && this.points.length > 1 && this.initPoint && this.movePoint) {
        this.appendCurveComponent();
      }

      e.preventDefault();
      this.deleteCurrentTool();
      this.deactivate();
      this.reset();
    }
  };

  draw = () => {
    if (!this.initPoint || !this.movePoint) return;

    this.ctx.beginPath();
    this.ctx.arc(this.initPoint.x, this.initPoint.y, 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.leftMenuManager.strokeColor;
    this.ctx.fill();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.moveTo(this.initPoint.x, this.initPoint.y);
    for (let i = 1; i < this.points.length; i++) {
      this.ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    this.ctx.lineTo(this.movePoint.x, this.movePoint.y);
    this.ctx.strokeStyle = this.leftMenuManager.strokeColor;
    this.ctx.stroke();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.arc(this.movePoint.x, this.movePoint.y, 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.leftMenuManager.strokeColor;
    this.ctx.fill();
    this.ctx.closePath();

    return;
  };

  private appendCurveComponent = () => {
    if (!this.initPoint || !this.movePoint) return;

    const { x: initX, y: initY } = this.initPoint;
    const { x: endX, y: endY } = this.movePoint;

    const crossPoints = this.points.slice(1, this.points.length - 1).map((item) => ({ cx: item.x, cy: item.y }));

    const line = new Line({
      canvas: this.canvas,
      ctx: this.ctx,
      activeManager: this.activeManager,
      type: "curve",
      position: {
        x1: initX,
        y1: initY,
        x2: endX,
        y2: endY,
        crossPoints,
      },
    });

    line.color = this.leftMenuManager.strokeColor;
    this.componentManager.add(line);
  };

  private appendLineComponent = () => {
    if (!this.initPoint || !this.movePoint) return;

    const { x: initX, y: initY } = this.initPoint;
    const { x: endX, y: endY } = this.movePoint;

    const cx = Math.min(initX, endX) + Math.abs(endX - initX) / 2;
    const cy = Math.min(initY, endY) + Math.abs(endY - initY) / 2;

    const line = new Line({
      canvas: this.canvas,
      ctx: this.ctx,
      position: {
        x1: initX,
        y1: initY,
        crossPoints: [
          {
            cx,
            cy,
          },
        ],
        x2: endX,
        y2: endY,
      },
      activeManager: this.activeManager,
    });

    line.color = this.leftMenuManager.strokeColor;

    this.componentManager.add(line);
  };
}
