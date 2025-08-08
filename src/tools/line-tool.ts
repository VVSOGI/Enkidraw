import { BaseTool, BaseToolProps } from "./base-tool";
import { MousePoint } from "../types";
import { Line } from "../components";
import { ComponentManager, LeftMenuManager } from "../managers";

interface LineToolProps extends BaseToolProps {
  componentManager: ComponentManager;
  leftMenuManager: LeftMenuManager;
}

export class LineTool extends BaseTool {
  public readonly name = "line";
  private initPoint: MousePoint | null = null;
  private movePoint: MousePoint | null = null;
  private multiPointDrawMode: boolean = false;
  private points: MousePoint[] = [];

  protected componentManager: ComponentManager;
  protected leftMenuManager: LeftMenuManager;

  constructor({
    canvas,
    ctx,
    leftMenuManager,
    componentManager,
    selectTool,
    deleteCurrentTool,
    getZoomTransform,
  }: LineToolProps) {
    super({ canvas, ctx, selectTool, deleteCurrentTool, getZoomTransform });
    this.leftMenuManager = leftMenuManager;
    this.componentManager = componentManager;
  }

  private reset = () => {
    this.isDrawing = false;
    this.initPoint = null;
    this.movePoint = null;
    this.multiPointDrawMode = false;
    this.points = [];
  };

  onMouseDown = (e: MouseEvent) => {
    const position = this.getLogicalMousePos(e);

    if (!this.isDrawing) {
      this.isDrawing = true;
      this.initPoint = position;
      this.movePoint = position;
      this.points.push(this.initPoint);
    }
  };

  onMouseMove = (e: MouseEvent) => {
    this.movePoint = this.getLogicalMousePos(e);
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
      this.appendLineComponent(this.initPoint, this.movePoint);
      this.deactivate();
      this.reset();
    }
  };

  onKeyDown = (e: KeyboardEvent) => {
    if (!this.isActive || (e.key !== "Esc" && e.key !== "Escape")) {
      this.deleteCurrentTool();
      this.deactivate();
      return;
    }

    if (!this.initPoint || !this.movePoint || !this.multiPointDrawMode) {
      this.deleteCurrentTool();
      this.deactivate();
      this.reset();
      return;
    }

    if (this.points.length > 2) {
      this.appendCurveComponent();
    }

    if (this.points.length === 2) {
      this.appendLineComponent(this.initPoint, this.points[this.points.length - 1]);
    }

    e.preventDefault();
    this.deleteCurrentTool();
    this.deactivate();
    this.reset();
  };

  draw = () => {
    if (!this.initPoint || !this.movePoint) return;

    this.ctx.save();
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
    this.ctx.lineWidth = 10;
    this.ctx.lineCap = "round";
    this.ctx.stroke();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.arc(this.movePoint.x, this.movePoint.y, 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.leftMenuManager.strokeColor;
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();

    return;
  };

  private appendCurveComponent = () => {
    if (!this.initPoint || !this.movePoint || !this.getZoomTransform) return;

    const initPoint = this.points[0];
    const endPoint = this.points[this.points.length - 1];

    const crossPoints = this.points.slice(1, this.points.length - 1).map((item) => ({ cx: item.x, cy: item.y }));

    const line = new Line({
      canvas: this.canvas,
      ctx: this.ctx,
      type: "curve",
      position: {
        x1: initPoint.x,
        y1: initPoint.y,
        x2: endPoint.x,
        y2: endPoint.y,
        crossPoints,
      },
      getZoomTransform: this.getZoomTransform,
    });

    line.color = this.leftMenuManager.strokeColor;
    this.componentManager.add(line);
  };

  private appendLineComponent = (init: MousePoint, end: MousePoint) => {
    if (!this.getZoomTransform) return;

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
        crossPoints: [
          {
            cx,
            cy,
          },
        ],
        x2: endX,
        y2: endY,
      },
      getZoomTransform: this.getZoomTransform,
    });

    line.color = this.leftMenuManager.strokeColor;

    this.componentManager.add(line);
  };
}
