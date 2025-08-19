import { v4 } from "uuid";
import { BaseComponent, BaseComponentProps, BasePosition } from ".";
import { DragRange, EdgeDirection, MathUtils, MousePoint, MouseUtils, STYLE_SYSTEM } from "..";

export class Circle extends BaseComponent<BasePosition> {
  public id: string = v4();
  public name: string = "circle";

  private totalPadding = 10;
  private dragCornorRectSize = 10;

  constructor({ canvas, ctx, position, getZoomTransform }: BaseComponentProps<BasePosition>) {
    super({ canvas, ctx, position, getZoomTransform });
    this.isTransformSelect = true;
  }

  initialPosition = () => {
    this.originPosition = {
      ...this.position,
      x1: this.position.x1,
      y1: this.position.y1,
      x2: this.position.x2,
      y2: this.position.y2,
    };
  };

  getPosition = () => {
    const x1 = Math.min(this.position.x1 - this.totalPadding, this.position.x2 + this.totalPadding);
    const x2 = Math.max(this.position.x1 - this.totalPadding, this.position.x2 + this.totalPadding);
    const y1 = Math.min(this.position.y1 - this.totalPadding, this.position.y2 + this.totalPadding);
    const y2 = Math.max(this.position.y1 - this.totalPadding, this.position.y2 + this.totalPadding);

    return { x1, y1, x2, y2 };
  };

  isHover = (e: MouseEvent) => {
    const { x1, y1, x2, y2 } = this.position;
    const transform = this.getZoomTransform();

    if (this.isActive) {
      const { x: mouseX, y: mouseY } = MouseUtils.getLogicalMousePos(e, this.canvas, transform);

      if (
        mouseX >= x1 - this.totalPadding - this.dragCornorRectSize / 2 &&
        mouseX <= x2 + this.totalPadding + this.dragCornorRectSize / 2 &&
        mouseY >= y1 - this.totalPadding - this.dragCornorRectSize / 2 &&
        mouseY <= y2 + this.totalPadding + this.dragCornorRectSize / 2
      ) {
        return true;
      }
    }

    if (!this.isActive) {
      const { x: mouseX, y: mouseY } = MouseUtils.getLogicalMousePos(e, this.canvas, transform);
      const centerX = (this.position.x1 + this.position.x2) / 2;
      const centerY = (this.position.y1 + this.position.y2) / 2;
      const radiusX = Math.abs((this.position.x2 - this.position.x1) / 2);
      const radiusY = Math.abs((this.position.y2 - this.position.y1) / 2);

      const isInBound = MathUtils.isPointBoundByEllipse({
        mouseX,
        mouseY,
        centerX,
        centerY,
        radiusX,
        radiusY,
        threshold: STYLE_SYSTEM.STROKE_WIDTH,
      });

      if (isInBound) {
        return true;
      }
    }

    return false;
  };

  isClicked = (e: MouseEvent) => {
    const { x1, y1, x2, y2 } = this.position;
    const transform = this.getZoomTransform();

    if (this.isActive) {
      const { x: mouseX, y: mouseY } = MouseUtils.getLogicalMousePos(e, this.canvas, transform);

      if (
        mouseX >= x1 - this.totalPadding - this.dragCornorRectSize / 2 &&
        mouseX <= x2 + this.totalPadding + this.dragCornorRectSize / 2 &&
        mouseY >= y1 - this.totalPadding - this.dragCornorRectSize / 2 &&
        mouseY <= y2 + this.totalPadding + this.dragCornorRectSize / 2
      ) {
        return true;
      }
    }

    if (!this.isActive) {
      const { x: mouseX, y: mouseY } = MouseUtils.getLogicalMousePos(e, this.canvas, transform);
      const centerX = (this.position.x1 + this.position.x2) / 2;
      const centerY = (this.position.y1 + this.position.y2) / 2;
      const radiusX = Math.abs((this.position.x2 - this.position.x1) / 2);
      const radiusY = Math.abs((this.position.y2 - this.position.y1) / 2);

      const isInBound = MathUtils.isPointBoundByEllipse({
        mouseX,
        mouseY,
        centerX,
        centerY,
        radiusX,
        radiusY,
        threshold: STYLE_SYSTEM.STROKE_WIDTH,
      });

      if (isInBound) {
        return true;
      }
    }

    return false;
  };

  hoverComponent = (e: MouseEvent, move: MousePoint) => {};

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
    if (edgeDirection === "right") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX + mouseDistance.x;
      const scale = newTotalRangeX / totalRangeX;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x1 + relativeX1 * scale, multiSelectRange.x1 + relativeX2 * scale),
        x2: Math.max(multiSelectRange.x1 + relativeX1 * scale, multiSelectRange.x1 + relativeX2 * scale),
      };
    }

    if (edgeDirection === "left") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX - mouseDistance.x;
      const scale = newTotalRangeX / totalRangeX;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x2 + relativeX1 * scale, multiSelectRange.x2 + relativeX2 * scale),
        x2: Math.max(multiSelectRange.x2 + relativeX1 * scale, multiSelectRange.x2 + relativeX2 * scale),
      };
    }

    if (edgeDirection === "top") {
      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY - mouseDistance.y;
      const scale = newTotalRangeY / totalRangeY;

      const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

      // Adjust all points with the same scale
      this.position = {
        ...this.position,
        y1: Math.min(multiSelectRange.y2 + relativeY1 * scale, multiSelectRange.y2 + relativeY2 * scale),
        y2: Math.max(multiSelectRange.y2 + relativeY1 * scale, multiSelectRange.y2 + relativeY2 * scale),
      };
    }

    if (edgeDirection === "bottom") {
      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY + mouseDistance.y;
      const scale = newTotalRangeY / totalRangeY;

      const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

      this.position = {
        ...this.position,
        y1: Math.min(multiSelectRange.y1 + relativeY1 * scale, multiSelectRange.y1 + relativeY2 * scale),
        y2: Math.max(multiSelectRange.y1 + relativeY1 * scale, multiSelectRange.y1 + relativeY2 * scale),
      };
    }

    if (edgeDirection === "top-left") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX - mouseDistance.x;
      const scaleX = newTotalRangeX / totalRangeX;

      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY - mouseDistance.y;
      const scaleY = newTotalRangeY / totalRangeY;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x2 + relativeX1 * scaleX, multiSelectRange.x2 + relativeX2 * scaleX),
        y1: Math.min(multiSelectRange.y2 + relativeY1 * scaleY, multiSelectRange.y2 + relativeY2 * scaleY),
        x2: Math.max(multiSelectRange.x2 + relativeX1 * scaleX, multiSelectRange.x2 + relativeX2 * scaleX),
        y2: Math.max(multiSelectRange.y2 + relativeY1 * scaleY, multiSelectRange.y2 + relativeY2 * scaleY),
      };
    }

    if (edgeDirection === "top-right") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX + mouseDistance.x;
      const scaleX = newTotalRangeX / totalRangeX;

      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY - mouseDistance.y;
      const scaleY = newTotalRangeY / totalRangeY;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x1 + relativeX1 * scaleX, multiSelectRange.x1 + relativeX2 * scaleX),
        y1: Math.min(multiSelectRange.y2 + relativeY1 * scaleY, multiSelectRange.y2 + relativeY2 * scaleY),
        x2: Math.max(multiSelectRange.x1 + relativeX1 * scaleX, multiSelectRange.x1 + relativeX2 * scaleX),
        y2: Math.max(multiSelectRange.y2 + relativeY1 * scaleY, multiSelectRange.y2 + relativeY2 * scaleY),
      };
    }

    if (edgeDirection === "bottom-left") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX - mouseDistance.x;
      const scaleX = newTotalRangeX / totalRangeX;

      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY + mouseDistance.y;
      const scaleY = newTotalRangeY / totalRangeY;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x2 + relativeX1 * scaleX, multiSelectRange.x2 + relativeX2 * scaleX),
        y1: Math.min(multiSelectRange.y1 + relativeY1 * scaleY, multiSelectRange.y1 + relativeY2 * scaleY),
        x2: Math.max(multiSelectRange.x2 + relativeX1 * scaleX, multiSelectRange.x2 + relativeX2 * scaleX),
        y2: Math.max(multiSelectRange.y1 + relativeY1 * scaleY, multiSelectRange.y1 + relativeY2 * scaleY),
      };
    }

    if (edgeDirection === "bottom-right") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX + mouseDistance.x;
      const scaleX = newTotalRangeX / totalRangeX;

      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY + mouseDistance.y;
      const scaleY = newTotalRangeY / totalRangeY;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x1 + relativeX1 * scaleX, multiSelectRange.x1 + relativeX2 * scaleX),
        y1: Math.min(multiSelectRange.y1 + relativeY1 * scaleY, multiSelectRange.y1 + relativeY2 * scaleY),
        x2: Math.max(multiSelectRange.x1 + relativeX1 * scaleX, multiSelectRange.x1 + relativeX2 * scaleX),
        y2: Math.max(multiSelectRange.y1 + relativeY1 * scaleY, multiSelectRange.y1 + relativeY2 * scaleY),
      };
    }
  };

  getMultiSelectHoverZone = (mouse: MousePoint): EdgeDirection | "inside" | "outside" => {
    const { x1: left, x2: right, y1: top, y2: bottom } = this.position;

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

    if (this.isActive) {
      const { x: mouseX, y: mouseY } = mouse;

      if (
        mouseX >= left - this.totalPadding - this.dragCornorRectSize / 2 &&
        mouseX <= right + this.totalPadding + this.dragCornorRectSize / 2 &&
        mouseY >= top - this.totalPadding - this.dragCornorRectSize / 2 &&
        mouseY <= bottom + this.totalPadding + this.dragCornorRectSize / 2
      ) {
        return "inside";
      }
    }

    if (!this.isActive) {
      const { x: mouseX, y: mouseY } = mouse;
      const centerX = (this.position.x1 + this.position.x2) / 2;
      const centerY = (this.position.y1 + this.position.y2) / 2;
      const radiusX = Math.abs((this.position.x2 - this.position.x1) / 2);
      const radiusY = Math.abs((this.position.y2 - this.position.y1) / 2);

      const isInBound = MathUtils.isPointBoundByEllipse({
        mouseX,
        mouseY,
        centerX,
        centerY,
        radiusX,
        radiusY,
        threshold: STYLE_SYSTEM.STROKE_WIDTH,
      });

      if (isInBound) {
        return "inside";
      }
    }

    return "outside";
  };

  multiDragEffect = () => {
    this.ctx.save();
    this.ctx.beginPath();

    const width = this.position.x2 - this.position.x1 + this.totalPadding * 2;
    const height = this.position.y2 - this.position.y1 + this.totalPadding * 2;

    this.ctx.strokeStyle = STYLE_SYSTEM.PRIMARY;
    this.ctx.rect(this.position.x1 - this.totalPadding, this.position.y1 - this.totalPadding, width, height);
    this.ctx.stroke();
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
    const centerX = (this.position.x1 + this.position.x2) / 2;
    const centerY = (this.position.y1 + this.position.y2) / 2;
    const radiusX = Math.abs((this.position.x2 - this.position.x1) / 2);
    const radiusY = Math.abs((this.position.y2 - this.position.y1) / 2);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = STYLE_SYSTEM.STROKE_WIDTH;
    this.ctx.strokeStyle = "black";
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();

    if (this.isActive) {
      this.dragEffect();
    }
  };
}
