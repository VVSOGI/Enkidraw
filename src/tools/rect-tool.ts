import { Rect } from "../components";
import { MousePoint } from "../types";
import { STYLE_SYSTEM } from "../utils";
import { BaseTool, BaseToolProps } from "./base-tool";

interface RectToolProps extends BaseToolProps {}

export class RectTool extends BaseTool {
  public readonly name: string = "rect";

  private initPoint: MousePoint | null = null;
  private movePoint: MousePoint | null = null;
  private borderRadius = 10;

  constructor({
    canvas,
    ctx,
    activeManager,
    componentManager,
    selectTool,
    deleteCurrentTool,
    getZoomTransform,
  }: RectToolProps) {
    super({ canvas, ctx, activeManager, componentManager, selectTool, deleteCurrentTool, getZoomTransform });
  }

  activate = () => {
    this.isActive = true;
    this.addEventListeners();
    this.selectTool(this);
  };

  onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Escape") {
      this.deactivate();
    }
  };

  reset = () => {
    this.initPoint = null;
    this.movePoint = null;
  };

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

  draw = () => {
    if (!this.initPoint || !this.movePoint) return;

    const { x: startX, y: startY } = this.initPoint;
    const { x: endX, y: endY } = this.movePoint;

    const width = endX - startX;
    const height = endY - startY;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = STYLE_SYSTEM.STROKE_WIDTH;
    this.ctx.lineCap = "round";
    this.ctx.strokeStyle = "black";
    this.ctx.roundRect(startX, startY, width, height, this.borderRadius);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  private appendComponent = (start: MousePoint, end: MousePoint) => {
    const { x: startX, y: startY } = start;
    const { x: endX, y: endY } = end;
    const position = {
      x1: Math.min(startX, endX),
      y1: Math.min(startY, endY),
      x2: Math.max(startX, endX),
      y2: Math.max(startY, endY),
    };

    const rect = new Rect({ canvas: this.canvas, ctx: this.ctx, position, getZoomTransform: this.getZoomTransform });
    this.componentManager.add(rect);
  };
}
