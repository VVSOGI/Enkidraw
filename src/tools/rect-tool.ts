import { MousePoint } from "../types";
import { BaseTool, BaseToolProps } from "./base-tool";

interface RectToolProps extends BaseToolProps {}

export class RectTool extends BaseTool {
  public readonly name: string = "rect";

  private initPoint: MousePoint | null = null;
  private movePoint: MousePoint | null = null;
  private lineWidth = 4;
  private borderRadius = 10;

  constructor({ canvas, ctx, selectTool, deleteCurrentTool, getZoomTransform, activeManager }: RectToolProps) {
    super({ canvas, ctx, selectTool, deleteCurrentTool, getZoomTransform, activeManager });
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
    this.isDrawing = true;
    this.activeManager.selectCurrentActive("line");
    const position = this.getLogicalMousePos(e);
    this.initPoint = position;
    this.movePoint = position;
  };

  onMouseMove = (e: MouseEvent) => {
    if (this.isDrawing) {
      const position = this.getLogicalMousePos(e);
      this.movePoint = position;
    } else {
    }
  };

  onMouseUp = (e: MouseEvent) => {
    if (this.isDrawing) {
      this.isDrawing = false;
    }
  };

  draw = () => {
    if (!this.isDrawing || !this.initPoint || !this.movePoint) return;

    const { x: startX, y: startY } = this.initPoint;
    const { x: endX, y: endY } = this.movePoint;

    const width = endX - startX;
    const height = endY - startY;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = "round";
    this.ctx.strokeStyle = "black";
    this.ctx.roundRect(startX, startY, width, height, this.borderRadius);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };
}
