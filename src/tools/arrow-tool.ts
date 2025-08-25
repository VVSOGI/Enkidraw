import { LeftMenuManager, MousePoint } from "..";
import { BaseTool, BaseToolProps } from "./base-tool";

interface ArrowToolProps extends BaseToolProps {
  leftMenuManager: LeftMenuManager;
}

export class ArrowTool extends BaseTool {
  name: string = "arrow-tool";

  private initPoint: MousePoint | null = null;
  private movePoint: MousePoint | null = null;
  private points: MousePoint[] = [];

  protected leftMenuManager: LeftMenuManager;

  constructor({
    canvas,
    ctx,
    activeManager,
    componentManager,
    leftMenuManager,
    selectTool,
    deleteCurrentTool,
    getZoomTransform,
  }: ArrowToolProps) {
    super({
      canvas,
      ctx,
      activeManager,
      componentManager,
      selectTool,
      deleteCurrentTool,
      getZoomTransform,
    });
    this.leftMenuManager = leftMenuManager;
  }

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

  onMouseUp = (e: MouseEvent) => {};

  onKeyDown = (e: KeyboardEvent) => {};

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
  };

  reset = () => {
    this.isDrawing = false;
    this.initPoint = null;
    this.movePoint = null;
  };
}
