import { DragRange, EdgeDirection, MousePoint, MouseUtils, STYLE_SYSTEM } from "..";
import { BaseComponent, BaseComponentProps, BasePosition } from "./base-component";

type Direction = "vertical" | "horizontal";

export interface ArrowPosition extends BasePosition {
  crossPoints: {
    cx: number;
    cy: number;
    direction: Direction;
  }[];
}

interface Props<T> extends BaseComponentProps<T> {
  type: "line" | "curve" | "angle";
  direction: Direction;
}

export class Arrow extends BaseComponent<ArrowPosition> {
  name = "arrow-component";
  type: "line" | "curve" | "angle" = "line";
  lineWidth = 5;

  private dragCornerRectSize = 7.5;
  private totalPadding = 10;
  private dragCornorRectSize = 10;
  private moveCornorPoint = -1;
  private hoverPosition: { position: MousePoint } | null = null;
  private direction: Direction;
  private isMovePoint: boolean = false;

  constructor({ canvas, ctx, position, direction, type, getZoomTransform }: Props<ArrowPosition>) {
    super({ canvas, ctx, position, getZoomTransform });
    this.type = type;
    this.isTransformSelect = true;
    this.direction = direction;
  }

  initialPosition = () => {
    this.originPosition = {
      x1: this.position.x1,
      y1: this.position.y1,
      x2: this.position.x2,
      y2: this.position.y2,
      crossPoints: this.position.crossPoints.map((point) => ({ ...point })),
    };

    this.moveCornorPoint = -1;
    this.isMovePoint = false;
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
        x1: left - this.totalPadding,
        y1: top - this.totalPadding,
        x2: right + this.totalPadding,
        y2: bottom + this.totalPadding,
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
      const { point, coordinates } = this.getMouseHitControlPoint({ x: mouseX, y: mouseY });
      this.moveCornorPoint = point;

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

  hoverComponent = (e: MouseEvent, move: MousePoint) => {
    if (!this.isActive) return;

    const { point, coordinates } = this.getMouseHitControlPoint(move);

    if (point > -1) {
      this.hoverPosition = { position: coordinates as MousePoint };
    } else {
      this.hoverPosition = null;
    }
  };

  moveComponent = (e: MouseEvent, move: MousePoint) => {
    const { x: moveX, y: moveY } = move;
    const nextPosition = Object.assign({}, this.position);

    if (this.moveCornorPoint >= 0) {
      const crossPoints = this.position.crossPoints;
      const { firstSpare, secondSpare } = this.getCircleSpare();

      const points = [
        { x: this.position.x1, y: this.position.y1, direction: this.direction },
        { x: firstSpare.cx, y: firstSpare.cy, direction: firstSpare.direction },
        ...crossPoints.map(({ cx, cy, direction }) => ({ x: cx, y: cy, direction })),
        { x: secondSpare.cx, y: secondSpare.cy, direction: secondSpare.direction },
        { x: this.position.x2, y: this.position.y2, direction: this.direction },
      ];

      const positionTargetIndex = this.moveCornorPoint - 2;
      const target = this.position.crossPoints[positionTargetIndex];
      const originTarget = this.originPosition.crossPoints[positionTargetIndex];

      if (this.moveCornorPoint === 0) {
        return;
      }

      if (this.moveCornorPoint === 1) {
        return;
      }

      if (this.moveCornorPoint === points.length - 1) {
        return;
      }

      if (this.moveCornorPoint === points.length - 2) {
        const nextDirection = points[this.moveCornorPoint - 1].direction === "horizontal" ? "vertical" : "horizontal";
        const nextPosition: ArrowPosition["crossPoints"][0] = {
          cx: points[this.moveCornorPoint].x,
          cy: points[this.moveCornorPoint].y,
          direction: nextDirection,
        };

        if (!this.isMovePoint) {
          this.isMovePoint = true;
          this.position.crossPoints.push(Object.assign({}, nextPosition));
          this.originPosition.crossPoints.push(Object.assign({}, nextPosition));
        }
      }

      if (target) {
        this.updateNeighborPoints(crossPoints, points, positionTargetIndex, this.moveCornorPoint);

        if (target.direction === "vertical") {
          target.cx = originTarget.cx + moveX;
        } else {
          target.cy = originTarget.cy + moveY;
        }
      }

      return;
    }

    nextPosition.x1 = this.originPosition.x1 + moveX;
    nextPosition.y1 = this.originPosition.y1 + moveY;
    nextPosition.x2 = this.originPosition.x2 + moveX;
    nextPosition.y2 = this.originPosition.y2 + moveY;

    const crossPoints = this.originPosition.crossPoints.map((point) => {
      return {
        ...point,
        cx: point.cx + move.x,
        cy: point.cy + move.y,
      };
    });

    nextPosition.crossPoints = crossPoints;

    this.position = nextPosition;
  };

  private updateNeighborPoints = (
    crossPoints: ArrowPosition["crossPoints"],
    points: { x: number; y: number; direction: Direction }[],
    positionTargetIndex: number,
    moveCornorPoint: number
  ) => {
    console.log(crossPoints, positionTargetIndex);
    if (crossPoints.length <= 1) {
      return;
    }

    const target = crossPoints[positionTargetIndex];
    const targetBefore = crossPoints[positionTargetIndex - 1];
    const targetAfter = crossPoints[positionTargetIndex + 1];

    if (target.direction === "vertical") {
      if (targetBefore) {
        const beforePoint = points[moveCornorPoint - 2];
        targetBefore.cx = beforePoint.x + (target.cx - beforePoint.x) / 2;
      }

      if (targetAfter) {
        const afterPoint = points[moveCornorPoint + 2];
        targetAfter.cx = target.cx + (afterPoint.x - target.cx) / 2;
      }
    } else {
      if (targetBefore) {
        const beforePoint = points[moveCornorPoint - 2];
        targetBefore.cy = beforePoint.y + (target.cy - beforePoint.y) / 2;
      }

      if (targetAfter) {
        const afterPoint = points[moveCornorPoint + 2];
        targetAfter.cy = target.cy + (afterPoint.y - target.cy) / 2;
      }
    }
  };

  resizeComponent = (mouseDistance: MousePoint, multiSelectRange: DragRange, edgeDirection: EdgeDirection) => {
    if (edgeDirection === "left") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX - mouseDistance.x;
      const scale = newTotalRangeX / totalRangeX;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;

      const crossPoints = this.originPosition.crossPoints.map((point) => {
        const relativeCx = point.cx - multiSelectRange.x2;
        return {
          ...point,
          cx: multiSelectRange.x2 + relativeCx * scale,
          cy: point.cy,
        };
      });

      this.position = {
        ...this.position,
        x1: multiSelectRange.x2 + relativeX1 * scale,
        x2: multiSelectRange.x2 + relativeX2 * scale,
        crossPoints,
      };
    }

    if (edgeDirection === "right") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX + mouseDistance.x;
      const scale = newTotalRangeX / totalRangeX;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;

      const crossPoints = this.originPosition.crossPoints.map((point) => {
        const relativeCx = point.cx - multiSelectRange.x1;
        return {
          ...point,
          cx: multiSelectRange.x1 + relativeCx * scale,
          cy: point.cy,
        };
      });

      this.position = {
        ...this.position,
        x1: multiSelectRange.x1 + relativeX1 * scale,
        x2: multiSelectRange.x1 + relativeX2 * scale,
        crossPoints,
      };
    }

    if (edgeDirection === "top") {
      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY - mouseDistance.y;
      const scale = newTotalRangeY / totalRangeY;

      const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

      const crossPoints = this.originPosition.crossPoints.map((point) => {
        const relativeCy = point.cy - multiSelectRange.y2;
        return {
          ...point,
          cx: point.cx,
          cy: multiSelectRange.y2 + relativeCy * scale,
        };
      });

      this.position = {
        ...this.position,
        y1: multiSelectRange.y2 + relativeY1 * scale,
        y2: multiSelectRange.y2 + relativeY2 * scale,
        crossPoints,
      };
    }

    if (edgeDirection === "bottom") {
      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY + mouseDistance.y;
      const scale = newTotalRangeY / totalRangeY;

      const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

      const crossPoints = this.originPosition.crossPoints.map((point) => {
        const relativeCy = point.cy - multiSelectRange.y1;
        return {
          ...point,
          cx: point.cx,
          cy: multiSelectRange.y1 + relativeCy * scale,
        };
      });

      this.position = {
        ...this.position,
        y1: multiSelectRange.y1 + relativeY1 * scale,
        y2: multiSelectRange.y1 + relativeY2 * scale,
        crossPoints,
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
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

      const crossPoints = this.originPosition.crossPoints.map((point) => {
        const relativeCx = point.cx - multiSelectRange.x2;
        const relativeCy = point.cy - multiSelectRange.y2;
        return {
          ...point,
          cx: multiSelectRange.x2 + relativeCx * scaleX,
          cy: multiSelectRange.y2 + relativeCy * scaleY,
        };
      });

      this.position = {
        ...this.position,
        x1: multiSelectRange.x2 + relativeX1 * scaleX,
        y1: multiSelectRange.y2 + relativeY1 * scaleY,
        x2: multiSelectRange.x2 + relativeX2 * scaleX,
        y2: multiSelectRange.y2 + relativeY2 * scaleY,
        crossPoints,
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
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

      const crossPoints = this.originPosition.crossPoints.map((point) => {
        const relativeCx = point.cx - multiSelectRange.x1;
        const relativeCy = point.cy - multiSelectRange.y2;
        return {
          ...point,
          cx: multiSelectRange.x1 + relativeCx * scaleX,
          cy: multiSelectRange.y2 + relativeCy * scaleY,
        };
      });

      this.position = {
        ...this.position,
        x1: multiSelectRange.x1 + relativeX1 * scaleX,
        y1: multiSelectRange.y2 + relativeY1 * scaleY,
        x2: multiSelectRange.x1 + relativeX2 * scaleX,
        y2: multiSelectRange.y2 + relativeY2 * scaleY,
        crossPoints,
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
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

      const crossPoints = this.originPosition.crossPoints.map((point) => {
        const relativeCx = point.cx - multiSelectRange.x2;
        const relativeCy = point.cy - multiSelectRange.y1;
        return {
          ...point,
          cx: multiSelectRange.x2 + relativeCx * scaleX,
          cy: multiSelectRange.y1 + relativeCy * scaleY,
        };
      });

      this.position = {
        ...this.position,
        x1: multiSelectRange.x2 + relativeX1 * scaleX,
        y1: multiSelectRange.y1 + relativeY1 * scaleY,
        x2: multiSelectRange.x2 + relativeX2 * scaleX,
        y2: multiSelectRange.y1 + relativeY2 * scaleY,
        crossPoints,
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
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

      const crossPoints = this.originPosition.crossPoints.map((point) => {
        const relativeCx = point.cx - multiSelectRange.x1;
        const relativeCy = point.cy - multiSelectRange.y1;
        return {
          ...point,
          cx: multiSelectRange.x1 + relativeCx * scaleX,
          cy: multiSelectRange.y1 + relativeCy * scaleY,
        };
      });

      this.position = {
        ...this.position,
        x1: multiSelectRange.x1 + relativeX1 * scaleX,
        y1: multiSelectRange.y1 + relativeY1 * scaleY,
        x2: multiSelectRange.x1 + relativeX2 * scaleX,
        y2: multiSelectRange.y1 + relativeY2 * scaleY,
        crossPoints,
      };
    }
  };

  getMultiSelectHoverZone = (mouse: MousePoint): EdgeDirection | "inside" | "outside" => {
    const { x1: left, x2: right, y1: top, y2: bottom } = this.position;

    if (
      mouse.x >= left - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.x <= left - this.multiDragPadding &&
      mouse.y >= top - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.y <= top - this.multiDragPadding
    ) {
      return "top-left";
    }

    if (
      mouse.x >= right + this.multiDragPadding &&
      mouse.x <= right + this.multiDragPadding + this.dragCornorRectSize &&
      mouse.y >= top - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.y <= top - this.multiDragPadding
    ) {
      return "top-right";
    }

    if (
      mouse.x >= left - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.x <= left - this.multiDragPadding &&
      mouse.y >= bottom + this.multiDragPadding &&
      mouse.y <= bottom + this.multiDragPadding + this.dragCornorRectSize
    ) {
      return "bottom-left";
    }

    if (
      mouse.x >= right + this.multiDragPadding &&
      mouse.x <= right + this.multiDragPadding + this.dragCornorRectSize &&
      mouse.y >= bottom + this.multiDragPadding &&
      mouse.y <= bottom + this.multiDragPadding + this.dragCornorRectSize
    ) {
      return "bottom-right";
    }

    if (
      mouse.x >= left - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.x <= left - this.multiDragPadding &&
      mouse.y > top - this.multiDragPadding &&
      mouse.y < bottom + this.multiDragPadding
    ) {
      return "left";
    }

    if (
      mouse.x >= right + this.multiDragPadding &&
      mouse.x <= right + this.multiDragPadding + this.dragCornorRectSize &&
      mouse.y > top - this.multiDragPadding &&
      mouse.y < bottom + this.multiDragPadding
    ) {
      return "right";
    }

    if (
      mouse.x > left - this.multiDragPadding &&
      mouse.x < right + this.multiDragPadding &&
      mouse.y >= top - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.y <= top - this.multiDragPadding
    ) {
      return "top";
    }

    if (
      mouse.x > left - this.multiDragPadding &&
      mouse.x < right + this.multiDragPadding &&
      mouse.y >= bottom + this.multiDragPadding &&
      mouse.y <= bottom + this.multiDragPadding + this.dragCornorRectSize
    ) {
      return "bottom";
    }

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

  getCircleSpare = (): {
    firstSpare: ArrowPosition["crossPoints"][0];
    secondSpare: ArrowPosition["crossPoints"][0];
  } => {
    const firstSpare: ArrowPosition["crossPoints"][0] = {
      cx:
        this.position.crossPoints[0].direction === "vertical"
          ? this.position.x1 + (this.position.crossPoints[0].cx - this.position.x1) / 2
          : this.position.x1,
      cy:
        this.position.crossPoints[0].direction === "horizontal"
          ? this.position.y1 + (this.position.crossPoints[0].cy - this.position.y1) / 2
          : this.position.y1,
      direction: this.position.crossPoints[0].direction === "horizontal" ? "vertical" : "horizontal",
    };

    const secondSpare: ArrowPosition["crossPoints"][0] = {
      cx:
        this.position.crossPoints[this.position.crossPoints.length - 1].direction === "vertical"
          ? this.position.crossPoints[this.position.crossPoints.length - 1].cx +
            (this.position.x2 - this.position.crossPoints[this.position.crossPoints.length - 1].cx) / 2
          : this.position.x2,
      cy:
        this.position.crossPoints[this.position.crossPoints.length - 1].direction === "horizontal"
          ? this.position.crossPoints[this.position.crossPoints.length - 1].cy +
            (this.position.y2 - this.position.crossPoints[this.position.crossPoints.length - 1].cy) / 2
          : this.position.y2,
      direction:
        this.position.crossPoints[this.position.crossPoints.length - 1].direction === "horizontal"
          ? "vertical"
          : "horizontal",
    };

    return {
      firstSpare,
      secondSpare,
    };
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
    const points = [
      {
        x: this.position.x1,
        y: this.position.y1,
        direction: this.direction,
      },
      ...this.position.crossPoints.map((point) => ({ x: point.cx, y: point.cy, direction: point.direction })),
      {
        x: this.position.x2,
        y: this.position.y2,
        direction: this.direction,
      },
    ];

    if (this.direction === "horizontal") {
      const horizontalDirection = distanceX >= 0 ? "right" : "left";

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.color;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.lineCap = "round";
      this.ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const { x: currentX, y: currentY, direction } = points[i];
        const { x: nextX, y: nextY } = points[i + 1];

        if (direction === "horizontal") {
          this.ctx.lineTo(nextX, currentY);
        } else {
          this.ctx.lineTo(currentX, nextY);
        }
      }

      this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

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

    this.ctx.save();
    this.ctx.beginPath();

    const { firstSpare, secondSpare } = this.getCircleSpare();

    this.ctx.roundRect(
      firstSpare.cx + this.dragCornerRectSize / 2,
      firstSpare.cy + this.dragCornerRectSize / 2,
      -this.dragCornerRectSize,
      -this.dragCornerRectSize,
      4
    );
    this.ctx.roundRect(
      secondSpare.cx + this.dragCornerRectSize / 2,
      secondSpare.cy + this.dragCornerRectSize / 2,
      -this.dragCornerRectSize,
      -this.dragCornerRectSize,
      4
    );

    this.ctx.fillStyle = STYLE_SYSTEM.SECONDARY;
    this.ctx.fill();
    this.ctx.strokeStyle = STYLE_SYSTEM.SECONDARY;
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

  private hoverPointEffect = () => {
    if (!this.hoverPosition) return;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(
      this.hoverPosition.position.x - this.dragCornerRectSize,
      this.hoverPosition.position.y - this.dragCornerRectSize,
      15,
      15,
      10
    );
    this.ctx.fillStyle = STYLE_SYSTEM.PRIMARY;
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  };

  draw = () => {
    if (this.hoverPosition) {
      this.hoverPointEffect();
    }

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

  private getMouseHitControlPoint = (mousePosition: MousePoint) => {
    const { x: mouseX, y: mouseY } = mousePosition;

    const { firstSpare, secondSpare } = this.getCircleSpare();

    const points = [
      { x: this.position.x1, y: this.position.y1 },
      { x: firstSpare.cx, y: firstSpare.cy, direction: firstSpare.direction },
      ...this.position.crossPoints.map(({ cx, cy, direction }) => ({ x: cx, y: cy, direction })),
      { x: secondSpare.cx, y: secondSpare.cy, direction: secondSpare.direction },
      { x: this.position.x2, y: this.position.y2 },
    ];

    const hoveredPointIndex = points.findIndex(({ x, y }) => {
      return (
        mouseX >= x - this.dragCornerRectSize / 2 &&
        mouseX < x + this.dragCornerRectSize / 2 &&
        mouseY >= y - this.dragCornerRectSize / 2 &&
        mouseY < y + this.dragCornerRectSize / 2
      );
    });

    if (hoveredPointIndex >= 0) {
      const point = points[hoveredPointIndex];
      return {
        point: hoveredPointIndex,
        coordinates: {
          x: point.x,
          y: point.y,
        },
      };
    }

    return {
      point: -1,
      coordinates: {},
    };
  };
}
