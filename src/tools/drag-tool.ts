import { DragRange, MousePoint } from "../types/common";
import { BaseTool, BaseToolProps } from "./base-tool";

interface DragToolProps extends BaseToolProps {}

export class DragTool extends BaseTool {
  public readonly name = "drag";
  private initPoint: MousePoint | null = null;
  private movePoint: MousePoint | null = null;
  private isDrag: boolean = false;

  constructor({ canvas, ctx, selectTool, deleteCurrentTool, getZoomTransform }: DragToolProps) {
    super({ canvas, ctx, selectTool, deleteCurrentTool, getZoomTransform });
    this.activate();
  }

  activate = () => {
    this.isActive = true;
    this.addEventListeners();
  };

  onMouseDown = (e: MouseEvent) => {
    const position = this.getLogicalMousePos(e);

    this.isDrawing = true;
    this.initPoint = position;
    this.movePoint = position;
  };

  onMouseMove = (e: MouseEvent) => {
    if (!this.initPoint || !this.movePoint) return null;

    this.movePoint = this.getLogicalMousePos(e);

    const { x: initX, y: initY } = this.initPoint;
    const { x: moveX, y: moveY } = this.movePoint;

    if (!this.isDrag && (initX !== moveX || initY !== moveY)) {
      this.isDrag = true;
    }
  };

  onMouseUp = (e: MouseEvent) => {
    this.isDrawing = false;
    this.initPoint = null;
    this.movePoint = null;
    this.isDrag = false;
  };

  onKeyDown = (e: KeyboardEvent) => {};

  draw = (): DragRange | null => {
    if (!this.initPoint || !this.movePoint) return null;

    const { x: initX, y: initY } = this.initPoint;
    const { x: moveX, y: moveY } = this.movePoint;

    this.ctx.beginPath();
    this.ctx.moveTo(moveX, moveY);
    this.ctx.lineTo(initX, moveY);
    this.ctx.lineTo(initX, initY);
    this.ctx.lineTo(moveX, initY);
    this.ctx.lineTo(moveX, moveY);
    this.ctx.fillStyle = "rgba(105, 105, 230, 0.1)";
    this.ctx.strokeStyle = "rgba(105, 105, 230)";
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.closePath();

    const left = Math.min(moveX, initX);
    const top = Math.min(moveY, initY);
    const right = Math.max(moveX, initX);
    const bottom = Math.max(moveY, initY);

    return {
      x1: left,
      y1: top,
      x2: right,
      y2: bottom,
    };
  };
}
