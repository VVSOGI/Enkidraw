import { DragRange, EdgeDirection, MousePoint } from "../types";
import { MathUtils, MouseUtils, STYLE_SYSTEM } from "../utils";
import { BaseComponent, BaseComponentProps, BasePosition } from "./base-component";

export interface LinePosition extends BasePosition {
  crossPoints: {
    cx: number;
    cy: number;
  }[];
}

interface Props<T> extends BaseComponentProps<T> {
  type?: "line" | "curve";
}

export class Line extends BaseComponent<LinePosition> {
  readonly name: string = "line";

  private type: "line" | "curve" = "line";
  private threshold = 10;
  private dragCornerRectSize = 7.5;
  private moveCornorPoint = -1;
  private hoverPosition: { position: MousePoint } | null = null;

  constructor({ canvas, ctx, position, type = "line", getZoomTransform }: Props<LinePosition>) {
    super({ canvas, ctx, position, getZoomTransform });
    this.type = type;
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
    this.hoverPosition = null;
  };

  isHover = (e: MouseEvent) => {
    if (!this.getZoomTransform) return false;
    const zoomTransform = this.getZoomTransform();

    if (this.type === "curve") {
      const { x1, y1, x2, y2 } = this.getPosition();
      const mousePosition = MouseUtils.getLogicalMousePos(e, this.canvas, zoomTransform);
      const distance = MathUtils.getDistanceCurveFromPoint(mousePosition, this.position);

      if (this.isActive) {
        if (mousePosition.x >= x1 && mousePosition.x <= x2 && mousePosition.y >= y1 && mousePosition.y <= y2) {
          return true;
        }
      }

      if (distance <= this.threshold) {
        return true;
      }
    }

    if (this.type === "line") {
      const mousePosition = MouseUtils.getLogicalMousePos(e, this.canvas, zoomTransform);
      const distance = MathUtils.getDistanceLineFromPoint(mousePosition, this.threshold, this.position);
      if (distance <= this.threshold) {
        return true;
      }
    }

    return false;
  };

  isClicked = (e: MouseEvent) => {
    if (!this.getZoomTransform) return false;
    const zoomTransform = this.getZoomTransform();
    const mousePosition = MouseUtils.getLogicalMousePos(e, this.canvas, zoomTransform);
    const { x1, y1, x2, y2 } = this.getPosition();

    if (this.isActive) {
      if (this.type === "curve") {
        this.multiDragMode(true);
      }

      const { point } = this.getMouseHitControlPoint(mousePosition);
      if (point > -1) {
        this.moveCornorPoint = point;
      }

      return mousePosition.x >= x1 && mousePosition.x <= x2 && mousePosition.y >= y1 && mousePosition.y <= y2;
    }

    if (!this.isActive) {
      const distance =
        this.type === "curve"
          ? MathUtils.getDistanceCurveFromPoint(mousePosition, this.position)
          : MathUtils.getDistanceLineFromPoint(mousePosition, this.threshold, this.position);

      if (distance <= this.threshold) {
        if (this.type === "curve") {
          this.multiDragMode(true);
        }

        if (this.position.crossPoints.length > 1) {
          this.multiDragMode(true);
        }

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
    const points = [
      { x: this.position.x1, y: this.position.y1 },
      ...this.position.crossPoints.map(({ cx, cy }) => ({ x: cx, y: cy })),
      { x: this.position.x2, y: this.position.y2 },
    ];

    if (this.moveCornorPoint > -1) {
      if (this.type === "line" && this.moveCornorPoint === 1) {
        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);
        this.position.crossPoints[0].cx = crossTargetPoint.cx + move.x;
        this.position.crossPoints[0].cy = crossTargetPoint.cy + move.y;
        this.hoverPosition = {
          position: { x: this.position.crossPoints[0].cx, y: this.position.crossPoints[0].cy },
        };
        this.type = "curve";
        return;
      }

      if (this.type === "curve") {
        if (this.moveCornorPoint === 0) {
          this.position.x1 = this.originPosition.x1 + move.x;
          this.position.y1 = this.originPosition.y1 + move.y;
          this.hoverPosition = { position: { x: this.position.x1, y: this.position.y1 } };
        }

        if (this.moveCornorPoint > 0 && this.moveCornorPoint < points.length - 1) {
          const currentTarget = this.position.crossPoints[this.moveCornorPoint - 1];
          const currentOriginTarget = Object.assign({}, this.originPosition.crossPoints[this.moveCornorPoint - 1]);
          currentTarget.cx = currentOriginTarget.cx + move.x;
          currentTarget.cy = currentOriginTarget.cy + move.y;
          this.hoverPosition = {
            position: {
              x: currentTarget.cx,
              y: currentTarget.cy,
            },
          };
        }

        if (this.moveCornorPoint === points.length - 1) {
          this.position.x2 = this.originPosition.x2 + move.x;
          this.position.y2 = this.originPosition.y2 + move.y;
          this.hoverPosition = { position: { x: this.position.x1, y: this.position.y1 } };
        }

        return;
      }

      if (this.type === "line") {
        if (this.moveCornorPoint === 0) {
          this.position.x1 = this.originPosition.x1 + move.x;
          this.position.y1 = this.originPosition.y1 + move.y;
          this.hoverPosition = { position: { x: this.position.x1, y: this.position.y1 } };
        }

        if (this.moveCornorPoint === points.length - 1) {
          this.position.x2 = this.originPosition.x2 + move.x;
          this.position.y2 = this.originPosition.y2 + move.y;
          this.hoverPosition = { position: { x: this.position.x2, y: this.position.y2 } };
        }

        this.position.crossPoints[0].cx = (this.position.x1 + this.position.x2) / 2;
        this.position.crossPoints[0].cy = (this.position.y1 + this.position.y2) / 2;

        return;
      }
    }

    const crossPoints = this.originPosition.crossPoints.map(({ cx, cy }) => {
      return {
        cx: cx + move.x,
        cy: cy + move.y,
      };
    });

    this.position = {
      x1: this.originPosition.x1 + move.x,
      y1: this.originPosition.y1 + move.y,
      x2: this.originPosition.x2 + move.x,
      y2: this.originPosition.y2 + move.y,
      crossPoints,
    };
  };

  resizeComponent = (mouseDistance: MousePoint, multiSelectRange: DragRange, edgeDirection: EdgeDirection) => {
    /** Line */
    if (this.type === "line") {
      // Left resize
      if (edgeDirection === "left") {
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX - mouseDistance.x;
        const scale = newTotalRangeX / totalRangeX;

        // Calculate relative positions based on end point of selection area
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;
        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);

        crossTargetPoint.cx = multiSelectRange.x2 + ((relativeX1 + relativeX2) / 2) * scale;

        // Adjust all points with the same scale
        this.position = {
          ...this.position,
          x1: multiSelectRange.x2 + relativeX1 * scale,
          x2: multiSelectRange.x2 + relativeX2 * scale,
          crossPoints: [crossTargetPoint],
        };
      }

      // Right resize
      if (edgeDirection === "right") {
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX + mouseDistance.x;
        const scale = newTotalRangeX / totalRangeX;

        // Calculate relative positions based on start point of selection area
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);

        crossTargetPoint.cx = multiSelectRange.x1 + ((relativeX1 + relativeX2) / 2) * scale;

        // Adjust all points with the same scale
        this.position = {
          ...this.position,
          x1: multiSelectRange.x1 + relativeX1 * scale,
          x2: multiSelectRange.x1 + relativeX2 * scale,
          crossPoints: [crossTargetPoint],
        };
      }

      // Top resize
      if (edgeDirection === "top") {
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY - mouseDistance.y;
        const scale = newTotalRangeY / totalRangeY;

        // Calculate relative positions based on end point of selection area
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;
        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);

        crossTargetPoint.cy = multiSelectRange.y2 + ((relativeY1 + relativeY2) / 2) * scale;

        // Adjust all points with the same scale
        this.position = {
          ...this.position,
          y1: multiSelectRange.y2 + relativeY1 * scale,
          y2: multiSelectRange.y2 + relativeY2 * scale,
          crossPoints: [crossTargetPoint],
        };
      }

      // Bottom resize
      if (edgeDirection === "bottom") {
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY + mouseDistance.y;
        const scale = newTotalRangeY / totalRangeY;

        // Calculate relative positions based on start point of selection area
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;
        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);

        crossTargetPoint.cy = multiSelectRange.y1 + ((relativeY1 + relativeY2) / 2) * scale;

        // Adjust all points with the same scale
        this.position = {
          ...this.position,
          y1: multiSelectRange.y1 + relativeY1 * scale,
          y2: multiSelectRange.y1 + relativeY2 * scale,
          crossPoints: [crossTargetPoint],
        };
      }

      // Top-left corner resize
      if (edgeDirection === "top-left") {
        // Horizontal scale
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX - mouseDistance.x;
        const scaleX = newTotalRangeX / totalRangeX;

        // Vertical scale
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY - mouseDistance.y;
        const scaleY = newTotalRangeY / totalRangeY;

        // Calculate relative positions based on bottom-right corner
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;
        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);

        crossTargetPoint.cx = multiSelectRange.x2 + ((relativeX1 + relativeX2) / 2) * scaleX;
        crossTargetPoint.cy = multiSelectRange.y2 + ((relativeY1 + relativeY2) / 2) * scaleY;

        // Adjust all points with both scales
        this.position = {
          ...this.position,
          x1: multiSelectRange.x2 + relativeX1 * scaleX,
          y1: multiSelectRange.y2 + relativeY1 * scaleY,
          crossPoints: [crossTargetPoint],
          x2: multiSelectRange.x2 + relativeX2 * scaleX,
          y2: multiSelectRange.y2 + relativeY2 * scaleY,
        };
      }

      // Top-right corner resize
      if (edgeDirection === "top-right") {
        // Horizontal scale
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX + mouseDistance.x;
        const scaleX = newTotalRangeX / totalRangeX;

        // Vertical scale
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY - mouseDistance.y;
        const scaleY = newTotalRangeY / totalRangeY;

        // Calculate relative positions
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;
        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);

        crossTargetPoint.cx = multiSelectRange.x1 + ((relativeX1 + relativeX2) / 2) * scaleX;
        crossTargetPoint.cy = multiSelectRange.y2 + ((relativeY1 + relativeY2) / 2) * scaleY;

        // Adjust all points with both scales
        this.position = {
          ...this.position,
          x1: multiSelectRange.x1 + relativeX1 * scaleX,
          y1: multiSelectRange.y2 + relativeY1 * scaleY,
          crossPoints: [crossTargetPoint],
          x2: multiSelectRange.x1 + relativeX2 * scaleX,
          y2: multiSelectRange.y2 + relativeY2 * scaleY,
        };
      }

      // Bottom-left corner resize
      if (edgeDirection === "bottom-left") {
        // Horizontal scale
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX - mouseDistance.x;
        const scaleX = newTotalRangeX / totalRangeX;

        // Vertical scale
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY + mouseDistance.y;
        const scaleY = newTotalRangeY / totalRangeY;

        // Calculate relative positions
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;
        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);

        crossTargetPoint.cx = multiSelectRange.x2 + ((relativeX1 + relativeX2) / 2) * scaleX;
        crossTargetPoint.cy = multiSelectRange.y1 + ((relativeY1 + relativeY2) / 2) * scaleY;

        // Adjust all points with both scales
        this.position = {
          ...this.position,
          x1: multiSelectRange.x2 + relativeX1 * scaleX,
          y1: multiSelectRange.y1 + relativeY1 * scaleY,
          crossPoints: [crossTargetPoint],
          x2: multiSelectRange.x2 + relativeX2 * scaleX,
          y2: multiSelectRange.y1 + relativeY2 * scaleY,
        };
      }

      // Bottom-right corner resize
      if (edgeDirection === "bottom-right") {
        // Horizontal scale
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX + mouseDistance.x;
        const scaleX = newTotalRangeX / totalRangeX;

        // Vertical scale
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY + mouseDistance.y;
        const scaleY = newTotalRangeY / totalRangeY;

        // Calculate relative positions based on top-left corner
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;
        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);

        crossTargetPoint.cx = multiSelectRange.x1 + ((relativeX1 + relativeX2) / 2) * scaleX;
        crossTargetPoint.cy = multiSelectRange.y1 + ((relativeY1 + relativeY2) / 2) * scaleY;

        // Adjust all points with both scales
        this.position = {
          ...this.position,
          x1: multiSelectRange.x1 + relativeX1 * scaleX,
          y1: multiSelectRange.y1 + relativeY1 * scaleY,
          crossPoints: [crossTargetPoint],
          x2: multiSelectRange.x1 + relativeX2 * scaleX,
          y2: multiSelectRange.y1 + relativeY2 * scaleY,
        };
      }
    }

    if (this.type === "curve") {
      if (edgeDirection === "left") {
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX - mouseDistance.x;
        const scale = newTotalRangeX / totalRangeX;

        // Calculate relative positions based on end point of selection area
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;

        const crossPoints = this.originPosition.crossPoints.map((point) => {
          const relativeCx = point.cx - multiSelectRange.x2;
          return {
            cx: multiSelectRange.x2 + relativeCx * scale,
            cy: point.cy,
          };
        });

        // Adjust all points with the same scale
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

        // Calculate relative positions based on start point of selection area
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;

        const crossPoints = this.originPosition.crossPoints.map((point) => {
          const relativeCx = point.cx - multiSelectRange.x1;
          return {
            cx: multiSelectRange.x1 + relativeCx * scale,
            cy: point.cy,
          };
        });

        // Adjust all points with the same scale
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

        // Calculate relative positions based on end point of selection area
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

        const crossPoints = this.originPosition.crossPoints.map((point) => {
          const relativeCy = point.cy - multiSelectRange.y2;
          return {
            cx: point.cx,
            cy: multiSelectRange.y2 + relativeCy * scale,
          };
        });

        // Adjust all points with the same scale
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

        // Calculate relative positions based on start point of selection area
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

        const crossPoints = this.originPosition.crossPoints.map((point) => {
          const relativeCy = point.cy - multiSelectRange.y1;
          return {
            cx: point.cx,
            cy: multiSelectRange.y1 + relativeCy * scale,
          };
        });

        // Adjust all points with the same scale
        this.position = {
          ...this.position,
          y1: multiSelectRange.y1 + relativeY1 * scale,
          y2: multiSelectRange.y1 + relativeY2 * scale,
          crossPoints,
        };
      }

      if (edgeDirection === "top-left") {
        // Horizontal scale
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX - mouseDistance.x;
        const scaleX = newTotalRangeX / totalRangeX;

        // Vertical scale
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY - mouseDistance.y;
        const scaleY = newTotalRangeY / totalRangeY;

        // Calculate relative positions based on bottom-right corner
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

        const crossPoints = this.originPosition.crossPoints.map((point) => {
          const relativeCx = point.cx - multiSelectRange.x2;
          const relativeCy = point.cy - multiSelectRange.y2;
          return {
            cx: multiSelectRange.x2 + relativeCx * scaleX,
            cy: multiSelectRange.y2 + relativeCy * scaleY,
          };
        });

        // Adjust all points with both scales
        this.position = {
          ...this.position,
          x1: multiSelectRange.x2 + relativeX1 * scaleX,
          y1: multiSelectRange.y2 + relativeY1 * scaleY,
          x2: multiSelectRange.x2 + relativeX2 * scaleX,
          y2: multiSelectRange.y2 + relativeY2 * scaleY,
          crossPoints,
        };
      }

      // Top-right corner resize
      if (edgeDirection === "top-right") {
        // Horizontal scale
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX + mouseDistance.x;
        const scaleX = newTotalRangeX / totalRangeX;

        // Vertical scale
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY - mouseDistance.y;
        const scaleY = newTotalRangeY / totalRangeY;

        // Calculate relative positions
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

        const crossPoints = this.originPosition.crossPoints.map((point) => {
          const relativeCx = point.cx - multiSelectRange.x1;
          const relativeCy = point.cy - multiSelectRange.y2;
          return {
            cx: multiSelectRange.x1 + relativeCx * scaleX,
            cy: multiSelectRange.y2 + relativeCy * scaleY,
          };
        });

        // Adjust all points with both scales
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
        // Horizontal scale
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX - mouseDistance.x;
        const scaleX = newTotalRangeX / totalRangeX;

        // Vertical scale
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY + mouseDistance.y;
        const scaleY = newTotalRangeY / totalRangeY;

        // Calculate relative positions
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

        const crossPoints = this.originPosition.crossPoints.map((point) => {
          const relativeCx = point.cx - multiSelectRange.x2;
          const relativeCy = point.cy - multiSelectRange.y1;
          return {
            cx: multiSelectRange.x2 + relativeCx * scaleX,
            cy: multiSelectRange.y1 + relativeCy * scaleY,
          };
        });

        // Adjust all points with both scales
        this.position = {
          ...this.position,
          x1: multiSelectRange.x2 + relativeX1 * scaleX,
          y1: multiSelectRange.y1 + relativeY1 * scaleY,
          x2: multiSelectRange.x2 + relativeX2 * scaleX,
          y2: multiSelectRange.y1 + relativeY2 * scaleY,
          crossPoints,
        };
      }

      // Bottom-right corner resize
      if (edgeDirection === "bottom-right") {
        // Horizontal scale
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX + mouseDistance.x;
        const scaleX = newTotalRangeX / totalRangeX;

        // Vertical scale
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY + mouseDistance.y;
        const scaleY = newTotalRangeY / totalRangeY;

        // Calculate relative positions based on top-left corner
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

        const crossPoints = this.originPosition.crossPoints.map((point) => {
          const relativeCx = point.cx - multiSelectRange.x1;
          const relativeCy = point.cy - multiSelectRange.y1;
          return {
            cx: multiSelectRange.x1 + relativeCx * scaleX,
            cy: multiSelectRange.y1 + relativeCy * scaleY,
          };
        });

        // Adjust all points with both scales
        this.position = {
          ...this.position,
          x1: multiSelectRange.x1 + relativeX1 * scaleX,
          y1: multiSelectRange.y1 + relativeY1 * scaleY,
          x2: multiSelectRange.x1 + relativeX2 * scaleX,
          y2: multiSelectRange.y1 + relativeY2 * scaleY,
          crossPoints,
        };
      }
    }
  };

  getPosition = (): BasePosition => {
    if (this.type === "curve") {
      const points = [
        { x: this.position.x1, y: this.position.y1 },
        ...this.position.crossPoints.map(({ cx, cy }) => ({ x: cx, y: cy })),
        { x: this.position.x2, y: this.position.y2 },
      ];

      const dots = 50;
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;

      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];

        const prevPoint = points[i - 1] || current;
        const nextPoint = points[i + 2] || next;

        const { cp1x, cp1y, cp2x, cp2y } = MathUtils.getSmoothCurveControlPoints(current, next, prevPoint, nextPoint);

        for (let j = 0; j < dots; j++) {
          const t = j / dots;

          const x = MathUtils.getCubicBezierCurve(t, current.x, cp1x, cp2x, next.x);
          const y = MathUtils.getCubicBezierCurve(t, current.y, cp1y, cp2y, next.y);

          left = Math.min(x - STYLE_SYSTEM.STROKE_WIDTH, left);
          top = Math.min(y - STYLE_SYSTEM.STROKE_WIDTH, top);
          right = Math.max(x + STYLE_SYSTEM.STROKE_WIDTH, right);
          bottom = Math.max(y + STYLE_SYSTEM.STROKE_WIDTH, bottom);
        }
      }

      return {
        x1: left,
        y1: top,
        x2: right,
        y2: bottom,
      };
    }

    const left = Math.min(this.position.x1, this.position.x2);
    const top = Math.min(this.position.y1, this.position.y2);
    const right = Math.max(this.position.x1, this.position.x2);
    const bottom = Math.max(this.position.y1, this.position.y2);

    return {
      x1: left - STYLE_SYSTEM.STROKE_WIDTH,
      y1: top - STYLE_SYSTEM.STROKE_WIDTH,
      x2: right + STYLE_SYSTEM.STROKE_WIDTH,
      y2: bottom + STYLE_SYSTEM.STROKE_WIDTH,
    };
  };

  multiDragMode = (mode: boolean) => {
    this.isMultiDrag = mode;
  };

  multiDragEffect = () => {
    const { x1, y1, x2, y2 } = this.getPosition();

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x1, y2);
    this.ctx.lineTo(x1, y1);
    this.ctx.strokeStyle = STYLE_SYSTEM.PRIMARY;
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  getMultiSelectHoverZone(mouse: MousePoint): EdgeDirection | "inside" | "outside" {
    return "inside";
  }

  private getMouseHitControlPoint = (mousePosition: MousePoint) => {
    const { x: mouseX, y: mouseY } = mousePosition;

    const points = [
      { x: this.position.x1, y: this.position.y1 },
      ...this.position.crossPoints.map(({ cx, cy }) => ({ x: cx, y: cy })),
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

  private hoverPointEffect = () => {
    if (!this.hoverPosition) return;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(this.hoverPosition.position.x - 7.5, this.hoverPosition.position.y - 7.5, 15, 15, 10);
    this.ctx.fillStyle = STYLE_SYSTEM.PRIMARY;
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  };

  private dragEffect = () => {
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

  draw = () => {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(this.position.x1, this.position.y1);

    if (this.type === "line") {
      this.ctx.lineTo(this.position.x2, this.position.y2);
    } else {
      const allPoints = [
        { x: this.position.x1, y: this.position.y1 },
        ...this.position.crossPoints.map((cp) => ({ x: cp.cx, y: cp.cy })),
        { x: this.position.x2, y: this.position.y2 },
      ];

      for (let i = 0; i < allPoints.length - 1; i++) {
        const startPoint = allPoints[i];
        const endPoint = allPoints[i + 1];

        const prevPoint = allPoints[i - 1] || startPoint;
        const nextPoint = allPoints[i + 2] || endPoint;

        const { cp1x, cp1y, cp2x, cp2y } = MathUtils.getSmoothCurveControlPoints(
          startPoint,
          endPoint,
          prevPoint,
          nextPoint
        );

        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endPoint.x, endPoint.y);
      }
    }

    this.ctx.strokeStyle = this.color;
    this.ctx.lineCap = "round";
    this.ctx.lineWidth = STYLE_SYSTEM.STROKE_WIDTH;
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();

    if (this.hoverPosition) {
      this.hoverPointEffect();
    }

    if (this.isActive) {
      this.dragEffect();
    }

    if (this.isMultiDrag) {
      this.multiDragEffect();
    }
  };
}
