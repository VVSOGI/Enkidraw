import { v4 } from "uuid";
import { BaseComponent, BaseComponentProps, BasePosition } from "./base-component";
import { DragRange, EdgeDirection, MousePoint, MouseUtils, STYLE_SYSTEM } from "..";

export class Rect extends BaseComponent {
  public id: string = v4();
  public name: string = "rect";

  private lineWidth = 4;
  private borderRadius = 10;
  private totalPadding = 10;
  private dragCornorRectSize = 10;
  private hoverCornor = {
    point: -1,
    coordinates: { x: 0, y: 0 },
  };

  constructor({ canvas, ctx, position, getZoomTransform }: BaseComponentProps<BasePosition>) {
    super({ canvas, ctx, position, getZoomTransform });
    this.isMultiDrag = true;
  }

  getPosition = () => {
    return this.position;
  };

  multiDragEffect = () => {};

  multiDragMode = (mode: boolean) => {};

  isHover = (e: MouseEvent) => {
    const { x1, y1, x2, y2 } = this.getPosition();
    const transform = this.getZoomTransform();
    const { x: mouseX, y: mouseY } = MouseUtils.getLogicalMousePos(e, this.canvas, transform);

    if (
      mouseX >= x1 - this.totalPadding - this.dragCornorRectSize / 2 &&
      mouseX <= x2 + this.totalPadding + this.dragCornorRectSize / 2 &&
      mouseY >= y1 - this.totalPadding - this.dragCornorRectSize / 2 &&
      mouseY <= y2 + this.totalPadding + this.dragCornorRectSize / 2
    ) {
      return true;
    }

    return false;
  };

  isClicked = (e: MouseEvent) => {
    const { x1, y1, x2, y2 } = this.getPosition();
    const transform = this.getZoomTransform();
    const { x: mouseX, y: mouseY } = MouseUtils.getLogicalMousePos(e, this.canvas, transform);

    if (
      mouseX >= x1 - this.totalPadding - this.dragCornorRectSize / 2 &&
      mouseX <= x2 + this.totalPadding + this.dragCornorRectSize / 2 &&
      mouseY >= y1 - this.totalPadding - this.dragCornorRectSize / 2 &&
      mouseY <= y2 + this.totalPadding + this.dragCornorRectSize / 2
    ) {
      return true;
    }

    return false;
  };

  hoverComponent = (e: MouseEvent, move: MousePoint) => {
    if (!this.isActive) return;

    const hoverCornor = this.getMouseHitControlPoint(move);

    if (hoverCornor.point !== -1) {
      this.hoverCornor = hoverCornor;
    } else {
      this.hoverCornor = {
        point: -1,
        coordinates: { x: 0, y: 0 },
      };
    }
  };

  moveComponent = (e: MouseEvent, move: MousePoint) => {
    const { x: moveX, y: moveY } = move;
    const nextPosition = Object.assign({}, this.position);
    nextPosition.x1 = this.originPosition.x1 + moveX;
    nextPosition.y1 = this.originPosition.y1 + moveY;
    nextPosition.x2 = this.originPosition.x2 + moveX;
    nextPosition.y2 = this.originPosition.y2 + moveY;

    this.position = nextPosition;
  };

  resizeComponent = (mouseDistance: MousePoint, multiSelectRange: DragRange, edgeDirection: EdgeDirection) => {
    console.log(edgeDirection);
  };

  initialPosition = () => {
    this.originPosition = {
      x1: this.position.x1,
      y1: this.position.y1,
      x2: this.position.x2,
      y2: this.position.y2,
    };
  };

  hoverCornorEffect = () => {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(
      this.hoverCornor.coordinates.x - this.dragCornorRectSize,
      this.hoverCornor.coordinates.y - this.dragCornorRectSize,
      this.dragCornorRectSize * 2,
      this.dragCornorRectSize * 2,
      10
    );
    this.ctx.fillStyle = STYLE_SYSTEM.SECONDARY;
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  };

  dragEffect = () => {
    this.ctx.save();
    this.ctx.beginPath();

    const width = this.position.x2 - this.position.x1 + this.totalPadding * 2;
    const height = this.position.y2 - this.position.y1 + this.totalPadding * 2;

    this.ctx.strokeStyle = STYLE_SYSTEM.PRIMARY;
    this.ctx.rect(this.position.x1 - this.totalPadding, this.position.y1 - this.totalPadding, width, height);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(
      this.position.x1 + this.dragCornorRectSize / 2 - this.totalPadding,
      this.position.y1 + this.dragCornorRectSize / 2 - this.totalPadding,
      -this.dragCornorRectSize,
      -this.dragCornorRectSize,
      4
    );
    this.ctx.roundRect(
      this.position.x2 + this.dragCornorRectSize / 2 + this.totalPadding,
      this.position.y1 + this.dragCornorRectSize / 2 - this.totalPadding,
      -this.dragCornorRectSize,
      -this.dragCornorRectSize,
      4
    );
    this.ctx.roundRect(
      this.position.x1 + this.dragCornorRectSize / 2 - this.totalPadding,
      this.position.y2 + this.dragCornorRectSize / 2 + this.totalPadding,
      -this.dragCornorRectSize,
      -this.dragCornorRectSize,
      4
    );
    this.ctx.roundRect(
      this.position.x2 + this.dragCornorRectSize / 2 + this.totalPadding,
      this.position.y2 + this.dragCornorRectSize / 2 + this.totalPadding,
      -this.dragCornorRectSize,
      -this.dragCornorRectSize,
      4
    );
    this.ctx.fillStyle = STYLE_SYSTEM.WHITE;
    this.ctx.fill();
    this.ctx.strokeStyle = STYLE_SYSTEM.PRIMARY;
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
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

    if (this.hoverCornor.point >= 0) {
      this.hoverCornorEffect();
    }

    if (this.isActive) {
      this.dragEffect();
    }
  };

  getMultiSelectHoverZone(mouse: MousePoint): EdgeDirection | "inside" | "outside" {
    const { x1: left, x2: right, y1: top, y2: bottom } = this.getPosition();

    // Top-left corner
    if (
      mouse.x >= left - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.x <= left - this.multiDragPadding &&
      mouse.y >= top - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.y <= top - this.multiDragPadding
    ) {
      return "top-left";
    }

    // Top-right corner
    if (
      mouse.x >= right + this.multiDragPadding &&
      mouse.x <= right + this.multiDragPadding + this.dragCornorRectSize &&
      mouse.y >= top - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.y <= top - this.multiDragPadding
    ) {
      return "top-right";
    }

    // Bottom-left corner
    if (
      mouse.x >= left - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.x <= left - this.multiDragPadding &&
      mouse.y >= bottom + this.multiDragPadding &&
      mouse.y <= bottom + this.multiDragPadding + this.dragCornorRectSize
    ) {
      return "bottom-left";
    }

    // Bottom-right corner
    if (
      mouse.x >= right + this.multiDragPadding &&
      mouse.x <= right + this.multiDragPadding + this.dragCornorRectSize &&
      mouse.y >= bottom + this.multiDragPadding &&
      mouse.y <= bottom + this.multiDragPadding + this.dragCornorRectSize
    ) {
      return "bottom-right";
    }

    // Left edge
    if (
      mouse.x >= left - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.x <= left - this.multiDragPadding &&
      mouse.y > top - this.multiDragPadding &&
      mouse.y < bottom + this.multiDragPadding
    ) {
      return "left";
    }

    // Right edge
    if (
      mouse.x >= right + this.multiDragPadding &&
      mouse.x <= right + this.multiDragPadding + this.dragCornorRectSize &&
      mouse.y > top - this.multiDragPadding &&
      mouse.y < bottom + this.multiDragPadding
    ) {
      return "right";
    }

    // Top edge
    if (
      mouse.x > left - this.multiDragPadding &&
      mouse.x < right + this.multiDragPadding &&
      mouse.y >= top - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.y <= top - this.multiDragPadding
    ) {
      return "top";
    }

    // Bottom edge
    if (
      mouse.x > left - this.multiDragPadding &&
      mouse.x < right + this.multiDragPadding &&
      mouse.y >= bottom + this.multiDragPadding &&
      mouse.y <= bottom + this.multiDragPadding + this.dragCornorRectSize
    ) {
      return "bottom";
    }

    // Inside
    if (
      mouse.x >= left - this.multiDragPadding &&
      mouse.x <= right + this.multiDragPadding &&
      mouse.y >= top - this.multiDragPadding &&
      mouse.y <= bottom + this.multiDragPadding
    ) {
      return "inside";
    }

    return "outside";
  }

  private getMouseHitControlPoint = (mouse: MousePoint) => {
    const { x: mouseX, y: mouseY } = mouse;

    const currentPosition = this.getPosition();

    const leftTop = {
      x: currentPosition.x1 - this.dragCornorRectSize,
      y: currentPosition.y1 - this.dragCornorRectSize,
    };

    const rightTop = {
      x: currentPosition.x2 + this.dragCornorRectSize,
      y: currentPosition.y1 - this.dragCornorRectSize,
    };

    const leftBottom = {
      x: currentPosition.x1 - this.dragCornorRectSize,
      y: currentPosition.y2 + this.dragCornorRectSize,
    };

    const rightBottom = {
      x: currentPosition.x2 + this.dragCornorRectSize,
      y: currentPosition.y2 + this.dragCornorRectSize,
    };

    const cornors = [leftTop, rightTop, leftBottom, rightBottom];
    const cornor = cornors.findIndex(
      ({ x, y }) =>
        mouseX >= x - this.totalPadding / 2 &&
        mouseX <= x + this.totalPadding / 2 &&
        mouseY >= y - this.totalPadding / 2 &&
        mouseY <= y + this.totalPadding / 2
    );

    return {
      point: cornor,
      coordinates: cornor >= 0 ? cornors[cornor] : { x: 0, y: 0 },
    };
  };
}
