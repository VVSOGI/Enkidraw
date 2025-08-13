import { v4 } from "uuid";
import { BaseComponent, BaseComponentProps, BasePosition } from "./base-component";
import { DragRange, EdgeDirection, MousePoint, MouseUtils } from "..";

export class Rect extends BaseComponent {
  public id: string = v4();
  public name: string = "rect";

  private lineWidth = 4;
  private borderRadius = 10;

  constructor({ canvas, ctx, position, getZoomTransform }: BaseComponentProps<BasePosition>) {
    super({ canvas, ctx, position, getZoomTransform });
  }

  multiDragEffect = () => {};

  multiDragMode = (mode: boolean) => {};

  isHover = (e: MouseEvent) => {
    const { x1, y1, x2, y2 } = this.getPosition();
    const transform = this.getZoomTransform();
    const { x: mouseX, y: mouseY } = MouseUtils.getLogicalMousePos(e, this.canvas, transform);

    if (mouseX >= x1 && mouseX <= x2 && mouseY >= y1 && mouseY <= y2) {
      return true;
    }

    return false;
  };

  isClicked = (e: MouseEvent) => {
    return false;
  };

  hoverComponent = (e: MouseEvent, move: MousePoint) => {};

  moveComponent = (e: MouseEvent, move: MousePoint) => {};

  resizeComponent = (mouseDistance: MousePoint, multiSelectRange: DragRange, edgeDirection: EdgeDirection) => {};

  initialPosition = () => {};

  getPosition = () => {
    return this.position;
  };

  draw = () => {
    const { x1: startX, y1: startY, x2: endX, y2: endY } = this.position;

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
