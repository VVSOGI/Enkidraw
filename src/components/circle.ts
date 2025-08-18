import { v4 } from "uuid";
import { BaseComponent, BaseComponentProps, BasePosition } from ".";
import { DragRange, EdgeDirection, MousePoint, STYLE_SYSTEM } from "..";

export class Circle extends BaseComponent {
  public id: string = v4();
  public name: string = "circle";

  constructor({ canvas, ctx, position, getZoomTransform }: BaseComponentProps<BasePosition>) {
    super({ canvas, ctx, position, getZoomTransform });
  }

  initialPosition = () => {
    return this.position;
  };

  getPosition = () => {
    return this.position;
  };

  isHover = (e: MouseEvent) => {
    return false;
  };

  isClicked = (e: MouseEvent) => {
    return false;
  };

  hoverComponent = (e: MouseEvent, move: MousePoint) => {};

  moveComponent = (e: MouseEvent, move: MousePoint) => {};

  resizeComponent = (mouseDistance: MousePoint, multiSelectRange: DragRange, edgeDirection: EdgeDirection) => {};

  getMultiSelectHoverZone = (mouse: MousePoint): EdgeDirection | "inside" | "outside" => {
    return "outside";
  };

  multiDragEffect = () => {};

  draw = () => {
    const { x1: startX, y1: startY, x2: endX, y2: endY } = this.position;

    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    const radiusX = Math.abs((endX - startX) / 2);
    const radiusY = Math.abs((endY - startY) / 2);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = STYLE_SYSTEM.STROKE_WIDTH;
    this.ctx.strokeStyle = "black";
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };
}
