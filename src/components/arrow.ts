import { DragRange, EdgeDirection, MathUtils, MousePoint, MouseUtils, STYLE_SYSTEM } from "..";
import { BaseComponent, BaseComponentProps, BasePosition } from "./base-component";

export interface ArrowPosition extends BasePosition {
  crossPoints: {
    cx: number;
    cy: number;
  }[];
}

interface Props<T> extends BaseComponentProps<T> {
  type: "line" | "curve" | "angle";
}

export class Arrow extends BaseComponent<ArrowPosition> {
  name = "arrow-component";
  type: "line" | "curve" | "angle" = "line";
  lineWidth = 5;
  private dragCornerRectSize = 7.5;
  private totalPadding = 10;
  private dragCornorRectSize = 10;

  constructor({ canvas, ctx, position, type, getZoomTransform }: Props<ArrowPosition>) {
    super({ canvas, ctx, position, getZoomTransform });
    this.type = type;
    this.isTransformSelect = true;
  }

  initialPosition = () => {
    this.originPosition = {
      x1: this.position.x1,
      y1: this.position.y1,
      x2: this.position.x2,
      y2: this.position.y2,
      crossPoints: this.position.crossPoints.map((point) => ({ ...point })),
    };
  };

  getPosition = () => {
    if (this.type === "line") {
      const left = Math.min(this.position.x1, this.position.x2);
      const top = Math.min(this.position.y1, this.position.y2);
      const right = Math.max(this.position.x1, this.position.x2);
      const bottom = Math.max(this.position.y1, this.position.y2);

      return {
        x1: left,
        y1: top,
        x2: right,
        y2: bottom,
      };
    }

    if (this.type === "angle") {
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;

      for (const point of this.position.crossPoints) {
        left = Math.min(left, this.position.x1, this.position.x2, point.cx);
        top = Math.min(top, this.position.y1, this.position.y2, point.cy);
        right = Math.max(right, this.position.x1, this.position.x2, point.cx);
        bottom = Math.max(bottom, this.position.y1, this.position.y2, point.cy);
      }

      return {
        x1: left,
        y1: top,
        x2: right,
        y2: bottom,
      };
    }

    return this.position;
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
      if (
        mouseX >= x1 - this.totalPadding - this.dragCornorRectSize / 2 &&
        mouseX <= x2 + this.totalPadding + this.dragCornorRectSize / 2 &&
        mouseY >= y1 - this.totalPadding - this.dragCornorRectSize / 2 &&
        mouseY <= y2 + this.totalPadding + this.dragCornorRectSize / 2
      ) {
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

      if (
        mouseX >= x1 - this.totalPadding - this.dragCornorRectSize / 2 &&
        mouseX <= x2 + this.totalPadding + this.dragCornorRectSize / 2 &&
        mouseY >= y1 - this.totalPadding - this.dragCornorRectSize / 2 &&
        mouseY <= y2 + this.totalPadding + this.dragCornorRectSize / 2
      ) {
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

    const crossPoints = this.originPosition.crossPoints.map(({ cx, cy }) => {
      return {
        cx: cx + move.x,
        cy: cy + move.y,
      };
    });

    nextPosition.crossPoints = crossPoints;

    this.position = nextPosition;
  };

  resizeComponent = (mouseDistance: MousePoint, multiSelectRange: DragRange, edgeDirection: EdgeDirection) => {};

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

    return "outside";
  };

  multiDragEffect = () => {};

  drawDefaultLine = () => {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(this.position.x1, this.position.y1);
    this.ctx.lineTo(this.position.x2, this.position.y2);
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = "round";
    this.ctx.stroke();
    this.ctx.closePath();

    const angle = Math.atan2(this.position.y2 - this.position.y1, this.position.x2 - this.position.x1);
    const headLength = 20;
    const headAngle = Math.PI / 6;

    this.ctx.beginPath();
    this.ctx.moveTo(this.position.x2, this.position.y2);
    this.ctx.lineTo(
      this.position.x2 - headLength * Math.cos(angle - headAngle),
      this.position.y2 - headLength * Math.sin(angle - headAngle)
    );
    this.ctx.moveTo(this.position.x2, this.position.y2);
    this.ctx.lineTo(
      this.position.x2 - headLength * Math.cos(angle + headAngle),
      this.position.y2 - headLength * Math.sin(angle + headAngle)
    );
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  drawAngleLine = () => {
    const distanceX = this.position.x2 - this.position.x1;
    const distanceY = this.position.y2 - this.position.y1;
    const centerX = this.position.x1 + distanceX / 2;
    const centerY = this.position.y1 + distanceY / 2;
    const headLength = 20;
    const headAngle = Math.PI / 6;

    if (Math.abs(distanceX) >= Math.abs(distanceY)) {
      const horizontalDirection = distanceX >= 0 ? "right" : "left";
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.color;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.lineCap = "round";
      this.ctx.moveTo(this.position.x1, this.position.y1);
      this.ctx.lineTo(centerX, this.position.y1);
      this.ctx.lineTo(centerX, this.position.y2);
      this.ctx.lineTo(this.position.x2, this.position.y2);

      if (horizontalDirection === "right") {
        this.ctx.moveTo(this.position.x2, this.position.y2);
        this.ctx.lineTo(this.position.x2 - headLength, this.position.y2 - headLength * headAngle);
        this.ctx.moveTo(this.position.x2, this.position.y2);
        this.ctx.lineTo(this.position.x2 - headLength, this.position.y2 + headLength * headAngle);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();
      }

      if (horizontalDirection === "left") {
        this.ctx.moveTo(this.position.x2, this.position.y2);
        this.ctx.lineTo(this.position.x2 + headLength, this.position.y2 - headLength * headAngle);
        this.ctx.moveTo(this.position.x2, this.position.y2);
        this.ctx.lineTo(this.position.x2 + headLength, this.position.y2 + headLength * headAngle);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();
      }

      return;
    } else {
      const verticalDirection = distanceY >= 0 ? "down" : "up";
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.color;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.lineCap = "round";
      this.ctx.moveTo(this.position.x1, this.position.y1);
      this.ctx.lineTo(this.position.x1, centerY);
      this.ctx.lineTo(this.position.x2, centerY);
      this.ctx.lineTo(this.position.x2, this.position.y2);

      if (verticalDirection === "down") {
        this.ctx.moveTo(this.position.x2, this.position.y2);
        this.ctx.lineTo(this.position.x2 + headLength * headAngle, this.position.y2 - headLength);
        this.ctx.moveTo(this.position.x2, this.position.y2);
        this.ctx.lineTo(this.position.x2 - headLength * headAngle, this.position.y2 - headLength);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();
      }

      if (verticalDirection === "up") {
        this.ctx.moveTo(this.position.x2, this.position.y2);
        this.ctx.lineTo(this.position.x2 + headLength * headAngle, this.position.y2 + headLength);
        this.ctx.moveTo(this.position.x2, this.position.y2);
        this.ctx.lineTo(this.position.x2 - headLength * headAngle, this.position.y2 + headLength);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();
      }
    }
  };

  dragEffect = () => {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(
      this.position.x1 + this.dragCornerRectSize / 2,
      this.position.y1 + this.dragCornerRectSize / 2,
      -this.dragCornerRectSize,
      -this.dragCornerRectSize,
      4
    );
    for (const point of this.position.crossPoints) {
      this.ctx.roundRect(
        point.cx + this.dragCornerRectSize / 2,
        point.cy + this.dragCornerRectSize / 2,
        -this.dragCornerRectSize,
        -this.dragCornerRectSize,
        4
      );
    }

    this.ctx.roundRect(
      this.position.x2 + this.dragCornerRectSize / 2,
      this.position.y2 + this.dragCornerRectSize / 2,
      -this.dragCornerRectSize,
      -this.dragCornerRectSize,
      4
    );
    this.ctx.fillStyle = STYLE_SYSTEM.WHITE;
    this.ctx.fill();
    this.ctx.strokeStyle = STYLE_SYSTEM.PRIMARY;
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  dragCornorEffect = () => {
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
    if (this.type === "line") {
      this.drawDefaultLine();
    }

    if (this.type === "angle") {
      this.drawAngleLine();
    }

    if (this.isActive) {
      this.dragEffect();
      this.dragCornorEffect();
    }
  };
}
