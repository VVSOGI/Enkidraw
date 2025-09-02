import { LeftMenuManager, MousePoint } from "..";
import { Arrow, ArrowPosition } from "../components";
import { BaseTool, BaseToolProps } from "./base-tool";

interface ArrowToolProps extends BaseToolProps {
  leftMenuManager: LeftMenuManager;
}

export class ArrowTool extends BaseTool {
  name: string = "arrow-tool";

  private initPoint: MousePoint | null = null;
  private movePoint: MousePoint | null = null;
  private points: MousePoint[] = [];
  private lineWidth = 5;
  private type: "line" | "curve" | "angle" = "angle";

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
    } else {
      this.isDrawing = false;
    }
  };

  onMouseMove = (e: MouseEvent) => {
    this.movePoint = this.getLogicalMousePos(e);
  };

  onMouseUp = (e: MouseEvent) => {
    if (!this.initPoint || !this.movePoint || this.isDrawing) return;

    this.activeManager.selectCurrentActive("default");
    this.appendComponent(this.initPoint, this.movePoint);
    this.deactivate();
    this.reset();
  };

  onKeyDown = (e: KeyboardEvent) => {};

  appendComponent = (init: MousePoint, end: MousePoint) => {
    if (!this.getZoomTransform) return;

    const { x: initX, y: initY } = init;
    const { x: endX, y: endY } = end;
    const distanceX = endX - initX;
    const distanceY = endY - initY;
    const cx = initX + distanceX / 2;
    const cy = initY + distanceY / 2;

    const direction = Math.abs(distanceX) >= Math.abs(distanceY) ? "horizontal" : "vertical";

    const arrow = new Arrow({
      canvas: this.canvas,
      ctx: this.ctx,
      totalDirection: direction,
      startDirection: direction,
      endDirection: direction,
      position: {
        x1: initX,
        y1: initY,
        crossPoints: [
          {
            cx,
            cy,
            direction: direction === "horizontal" ? "vertical" : "horizontal",
          },
        ],
        x2: endX,
        y2: endY,
      },
      type: this.type,
      getZoomTransform: this.getZoomTransform,
    });

    arrow.color = this.leftMenuManager.strokeColor;
    this.componentManager.add(arrow);
  };

  drawDefaultLine = () => {
    if (!this.initPoint || !this.movePoint) return;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(this.initPoint.x, this.initPoint.y);
    this.ctx.lineTo(this.movePoint.x, this.movePoint.y);
    this.ctx.strokeStyle = this.leftMenuManager.strokeColor;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = "round";
    this.ctx.stroke();
    this.ctx.closePath();

    const angle = Math.atan2(this.movePoint.y - this.initPoint.y, this.movePoint.x - this.initPoint.x);
    const headLength = 20;
    const headAngle = Math.PI / 6;

    this.ctx.beginPath();
    this.ctx.moveTo(this.movePoint.x, this.movePoint.y);
    this.ctx.lineTo(
      this.movePoint.x - headLength * Math.cos(angle - headAngle),
      this.movePoint.y - headLength * Math.sin(angle - headAngle)
    );
    this.ctx.moveTo(this.movePoint.x, this.movePoint.y);
    this.ctx.lineTo(
      this.movePoint.x - headLength * Math.cos(angle + headAngle),
      this.movePoint.y - headLength * Math.sin(angle + headAngle)
    );
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  drawAngleLine = () => {
    if (!this.initPoint || !this.movePoint) return;
    const distanceX = this.movePoint.x - this.initPoint.x;
    const distanceY = this.movePoint.y - this.initPoint.y;
    const centerX = this.initPoint.x + distanceX / 2;
    const centerY = this.initPoint.y + distanceY / 2;
    const headLength = 20;
    const headAngle = Math.PI / 6;

    if (Math.abs(distanceX) >= Math.abs(distanceY)) {
      const horizontalDirection = distanceX >= 0 ? "right" : "left";
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.leftMenuManager.strokeColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.lineCap = "round";
      this.ctx.moveTo(this.initPoint.x, this.initPoint.y);
      this.ctx.lineTo(centerX, this.initPoint.y);
      this.ctx.lineTo(centerX, this.movePoint.y);
      this.ctx.lineTo(this.movePoint.x, this.movePoint.y);

      if (horizontalDirection === "right") {
        this.ctx.moveTo(this.movePoint.x, this.movePoint.y);
        this.ctx.lineTo(this.movePoint.x - headLength, this.movePoint.y - headLength * headAngle);
        this.ctx.moveTo(this.movePoint.x, this.movePoint.y);
        this.ctx.lineTo(this.movePoint.x - headLength, this.movePoint.y + headLength * headAngle);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();
      }

      if (horizontalDirection === "left") {
        this.ctx.moveTo(this.movePoint.x, this.movePoint.y);
        this.ctx.lineTo(this.movePoint.x + headLength, this.movePoint.y - headLength * headAngle);
        this.ctx.moveTo(this.movePoint.x, this.movePoint.y);
        this.ctx.lineTo(this.movePoint.x + headLength, this.movePoint.y + headLength * headAngle);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();
      }

      return;
    } else {
      const verticalDirection = distanceY >= 0 ? "down" : "up";
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.leftMenuManager.strokeColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.lineCap = "round";
      this.ctx.moveTo(this.initPoint.x, this.initPoint.y);
      this.ctx.lineTo(this.initPoint.x, centerY);
      this.ctx.lineTo(this.movePoint.x, centerY);
      this.ctx.lineTo(this.movePoint.x, this.movePoint.y);

      if (verticalDirection === "down") {
        this.ctx.moveTo(this.movePoint.x, this.movePoint.y);
        this.ctx.lineTo(this.movePoint.x + headLength * headAngle, this.movePoint.y - headLength);
        this.ctx.moveTo(this.movePoint.x, this.movePoint.y);
        this.ctx.lineTo(this.movePoint.x - headLength * headAngle, this.movePoint.y - headLength);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();
      }

      if (verticalDirection === "up") {
        this.ctx.moveTo(this.movePoint.x, this.movePoint.y);
        this.ctx.lineTo(this.movePoint.x + headLength * headAngle, this.movePoint.y + headLength);
        this.ctx.moveTo(this.movePoint.x, this.movePoint.y);
        this.ctx.lineTo(this.movePoint.x - headLength * headAngle, this.movePoint.y + headLength);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();
      }
    }
  };

  draw = () => {
    if (!this.initPoint || !this.movePoint) return;

    if (this.type === "line") {
      this.drawDefaultLine();
    }

    if (this.type === "angle") {
      this.drawAngleLine();
    }
  };

  reset = () => {
    this.isDrawing = false;
    this.initPoint = null;
    this.movePoint = null;
  };
}
