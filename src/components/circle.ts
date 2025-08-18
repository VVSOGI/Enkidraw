import { v4 } from "uuid";
import { BaseComponent, BaseComponentProps, BasePosition } from ".";
import { DragRange, EdgeDirection, MathUtils, MousePoint, MouseUtils, STYLE_SYSTEM } from "..";

export interface CirclePosition extends BasePosition {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
}

export class Circle extends BaseComponent<CirclePosition> {
  public id: string = v4();
  public name: string = "circle";

  constructor({ canvas, ctx, position, getZoomTransform }: BaseComponentProps<CirclePosition>) {
    super({ canvas, ctx, position, getZoomTransform });
    this.isTransformSelect = true;
  }

  initialPosition = () => {
    return this.position;
  };

  getPosition = () => {
    return this.position;
  };

  isHover = (e: MouseEvent) => {
    const transform = this.getZoomTransform();
    const { x: mouseX, y: mouseY } = MouseUtils.getLogicalMousePos(e, this.canvas, transform);
    const isInBound = MathUtils.isPointBoundByEllipse({
      mouseX,
      mouseY,
      centerX: this.position.centerX,
      centerY: this.position.centerY,
      radiusX: this.position.radiusX,
      radiusY: this.position.radiusY,
      threshold: STYLE_SYSTEM.STROKE_WIDTH,
    });

    if (isInBound) {
      return true;
    }

    return false;
  };

  isClicked = (e: MouseEvent) => {
    const transform = this.getZoomTransform();
    const { x: mouseX, y: mouseY } = MouseUtils.getLogicalMousePos(e, this.canvas, transform);
    const isInBound = MathUtils.isPointBoundByEllipse({
      mouseX,
      mouseY,
      centerX: this.position.centerX,
      centerY: this.position.centerY,
      radiusX: this.position.radiusX,
      radiusY: this.position.radiusY,
      threshold: STYLE_SYSTEM.STROKE_WIDTH,
    });

    if (isInBound) {
      return true;
    }

    return false;
  };

  hoverComponent = (e: MouseEvent, move: MousePoint) => {};

  moveComponent = (e: MouseEvent, move: MousePoint) => {};

  resizeComponent = (mouseDistance: MousePoint, multiSelectRange: DragRange, edgeDirection: EdgeDirection) => {};

  getMultiSelectHoverZone = (mouse: MousePoint): EdgeDirection | "inside" | "outside" => {
    const { x: mouseX, y: mouseY } = mouse;
    const isInBound = MathUtils.isPointBoundByEllipse({
      mouseX,
      mouseY,
      centerX: this.position.centerX,
      centerY: this.position.centerY,
      radiusX: this.position.radiusX,
      radiusY: this.position.radiusY,
      threshold: STYLE_SYSTEM.STROKE_WIDTH,
    });

    if (isInBound) {
      return "inside";
    }

    return "outside";
  };

  multiDragEffect = () => {};

  draw = () => {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = STYLE_SYSTEM.STROKE_WIDTH;
    this.ctx.strokeStyle = "black";
    this.ctx.ellipse(
      this.position.centerX,
      this.position.centerY,
      this.position.radiusX,
      this.position.radiusY,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };
}
