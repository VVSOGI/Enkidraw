import { DragRange, EdgeDirection, MousePoint } from "..";
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

  constructor({ canvas, ctx, position, type, getZoomTransform }: Props<ArrowPosition>) {
    super({ canvas, ctx, position, getZoomTransform });
    this.type = type;
  }

  initialPosition = () => {};

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

  draw = () => {
    if (this.type === "line") {
      this.drawDefaultLine();
    }

    if (this.type === "angle") {
      this.drawAngleLine();
    }
  };
}
