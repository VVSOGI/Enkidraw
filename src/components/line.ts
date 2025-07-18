import { ActiveManager } from "../managers";
import { DragRange, EdgeDirection, MousePoint } from "../types";
import { MathUtils, MouseUtils, STYLE_SYSTEM } from "../utils";
import { BaseComponent, BasePosition } from "./base-component";

export interface LinePosition extends BasePosition {
  crossPoints: {
    cx: number;
    cy: number;
  }[];
}

interface Props {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  position: LinePosition;
  activeManager: ActiveManager;
  type?: "line" | "curve";
}

export class Line extends BaseComponent<LinePosition> {
  readonly name: string = "line";

  private type: "line" | "curve" = "line";
  private threshold = 10;
  private dragCornerRectSize = 7.5;
  private moveCornorPoint = -1;
  private hoverPosition: MousePoint | null = null;

  constructor({ canvas, ctx, position, activeManager, type = "line" }: Props) {
    super(canvas, ctx, position, activeManager);
    this.type = type;
  }

  initialPosition = () => {
    this.originPosition = {
      x1: this.position.x1,
      y1: this.position.y1,
      crossPoints: this.position.crossPoints.map((point) => ({ ...point })),
      x2: this.position.x2,
      y2: this.position.y2,
    };

    this.moveCornorPoint = -1;
    this.hoverPosition = null;
  };

  isHover = (e: MouseEvent) => {
    if (this.type === "curve") {
      const mousePosition = MouseUtils.getMousePos(e, this.canvas);
      const distance = MathUtils.getDistanceCurveFromPoint(mousePosition, this.position);
      if (distance <= this.threshold) {
        return true;
      }
    }

    if (this.type === "line") {
      const mousePosition = MouseUtils.getMousePos(e, this.canvas);
      const distance = MathUtils.getDistanceLineFromPoint(mousePosition, this.threshold, this.position);
      if (distance <= this.threshold) {
        return true;
      }
    }

    return false;
  };

  isClicked = (e: MouseEvent) => {
    const mousePosition = MouseUtils.getMousePos(e, this.canvas);
    const distance =
      this.type === "curve"
        ? MathUtils.getDistanceCurveFromPoint(mousePosition, this.position)
        : MathUtils.getDistanceLineFromPoint(mousePosition, this.threshold, this.position);
    if (distance <= this.threshold) {
      const { point } = this.getMouseHitControlPoint(mousePosition);
      if (point > -1) {
        this.moveCornorPoint = point;
      }
      return true;
    }

    return false;
  };

  hoverComponent = (e: MouseEvent, move: MousePoint) => {
    const isHovered = this.isHover(e);

    if (!isHovered) {
      this.hoverPosition = null;
      this.activeManager.setCursorStyle("default");
      return;
    }

    if (!this.isActive) {
      this.activeManager.setCursorStyle("pointer");
      return;
    }

    const { point, coordinates } = this.getMouseHitControlPoint(move);

    if (point > -1) {
      this.hoverPosition = coordinates as MousePoint;
      this.activeManager.setCursorStyle("pointer");
    } else {
      this.hoverPosition = null;
      this.activeManager.setCursorStyle("move");
    }
  };

  moveComponent = (e: MouseEvent, move: MousePoint) => {
    /**
     * If moveCornorPoint is greater than -1,
     * It means that the mouse is over the center point of the line component.
     * */
    if (this.moveCornorPoint > -1) {
      if (this.moveCornorPoint === 1) {
        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);
        this.position.crossPoints[0].cx = crossTargetPoint.cx + move.x;
        this.position.crossPoints[0].cy = crossTargetPoint.cy + move.y;
        this.hoverPosition = { x: this.position.crossPoints[0].cx, y: this.position.crossPoints[0].cy };
        this.type = "curve";
        return;
      }

      if (this.type === "curve") {
        if (this.moveCornorPoint === 0) {
          this.position.x1 = this.originPosition.x1 + move.x;
          this.position.y1 = this.originPosition.y1 + move.y;
          this.hoverPosition = { x: this.position.x1, y: this.position.y1 };
        }

        if (this.moveCornorPoint === 2) {
          this.position.x2 = this.originPosition.x2 + move.x;
          this.position.y2 = this.originPosition.y2 + move.y;
          this.hoverPosition = { x: this.position.x2, y: this.position.y2 };
        }

        return;
      }

      if (this.type === "line") {
        if (this.moveCornorPoint === 0) {
          this.position.x1 = this.originPosition.x1 + move.x;
          this.position.y1 = this.originPosition.y1 + move.y;
          this.hoverPosition = { x: this.position.x1, y: this.position.y1 };
        }

        if (this.moveCornorPoint === 2) {
          this.position.x2 = this.originPosition.x2 + move.x;
          this.position.y2 = this.originPosition.y2 + move.y;
          this.hoverPosition = { x: this.position.x2, y: this.position.y2 };
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
        const relativeCx = this.originPosition.crossPoints[0].cx - multiSelectRange.x2;

        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);
        crossTargetPoint.cx = multiSelectRange.x2 + relativeCx * scale;

        // Adjust all points with the same scale
        this.position = {
          ...this.position,
          x1: multiSelectRange.x2 + relativeX1 * scale,
          x2: multiSelectRange.x2 + relativeX2 * scale,
          crossPoints: [crossTargetPoint],
        };
      }

      if (edgeDirection === "right") {
        const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
        const newTotalRangeX = totalRangeX + mouseDistance.x;
        const scale = newTotalRangeX / totalRangeX;

        // Calculate relative positions based on start point of selection area
        const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
        const relativeCx = this.originPosition.crossPoints[0].cx - multiSelectRange.x1;

        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);
        crossTargetPoint.cx = multiSelectRange.x1 + relativeCx * scale;

        // Adjust all points with the same scale
        this.position = {
          ...this.position,
          x1: multiSelectRange.x1 + relativeX1 * scale,
          x2: multiSelectRange.x1 + relativeX2 * scale,
          crossPoints: [crossTargetPoint],
        };
      }

      if (edgeDirection === "top") {
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY - mouseDistance.y;
        const scale = newTotalRangeY / totalRangeY;

        // Calculate relative positions based on end point of selection area
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;
        const relativeCy = this.originPosition.crossPoints[0].cy - multiSelectRange.y2;

        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);
        crossTargetPoint.cy = multiSelectRange.y2 + relativeCy * scale;

        // Adjust all points with the same scale
        this.position = {
          ...this.position,
          y1: multiSelectRange.y2 + relativeY1 * scale,
          y2: multiSelectRange.y2 + relativeY2 * scale,
          crossPoints: [crossTargetPoint],
        };
      }

      if (edgeDirection === "bottom") {
        const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
        const newTotalRangeY = totalRangeY + mouseDistance.y;
        const scale = newTotalRangeY / totalRangeY;

        // Calculate relative positions based on start point of selection area
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;
        const relativeCy = this.originPosition.crossPoints[0].cy - multiSelectRange.y1;

        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);
        crossTargetPoint.cy = multiSelectRange.y1 + relativeCy * scale;

        // Adjust all points with the same scale
        this.position = {
          ...this.position,
          y1: multiSelectRange.y1 + relativeY1 * scale,
          y2: multiSelectRange.y1 + relativeY2 * scale,
          crossPoints: [crossTargetPoint],
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
        const relativeCx = this.originPosition.crossPoints[0].cx - multiSelectRange.x2;
        const relativeCy = this.originPosition.crossPoints[0].cy - multiSelectRange.y2;

        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);
        crossTargetPoint.cx = multiSelectRange.x2 + relativeCx * scaleX;
        crossTargetPoint.cy = multiSelectRange.y2 + relativeCy * scaleY;

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
        const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
        const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
        const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;
        const relativeCx = this.originPosition.crossPoints[0].cx - multiSelectRange.x1;
        const relativeCy = this.originPosition.crossPoints[0].cy - multiSelectRange.y2;

        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);
        crossTargetPoint.cx = multiSelectRange.x1 + relativeCx * scaleX;
        crossTargetPoint.cy = multiSelectRange.y2 + relativeCy * scaleY;

        // Adjust all points with both scales
        this.position = {
          ...this.position,
          x1: multiSelectRange.x1 + relativeX1 * scaleX,
          y1: multiSelectRange.y2 + relativeY1 * scaleY,
          x2: multiSelectRange.x1 + relativeX2 * scaleX,
          y2: multiSelectRange.y2 + relativeY2 * scaleY,
          crossPoints: [crossTargetPoint],
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
        const relativeCx = this.originPosition.crossPoints[0].cx - multiSelectRange.x2;
        const relativeCy = this.originPosition.crossPoints[0].cy - multiSelectRange.y1;

        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);
        crossTargetPoint.cx = multiSelectRange.x2 + relativeCx * scaleX;
        crossTargetPoint.cy = multiSelectRange.y1 + relativeCy * scaleY;

        // Adjust all points with both scales
        this.position = {
          ...this.position,
          x1: multiSelectRange.x2 + relativeX1 * scaleX,
          y1: multiSelectRange.y1 + relativeY1 * scaleY,
          x2: multiSelectRange.x2 + relativeX2 * scaleX,
          y2: multiSelectRange.y1 + relativeY2 * scaleY,
          crossPoints: [crossTargetPoint],
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
        const relativeCx = this.originPosition.crossPoints[0].cx - multiSelectRange.x1;
        const relativeCy = this.originPosition.crossPoints[0].cy - multiSelectRange.y1;

        const crossTargetPoint = Object.assign({}, this.originPosition.crossPoints[0]);
        crossTargetPoint.cx = multiSelectRange.x1 + relativeCx * scaleX;
        crossTargetPoint.cy = multiSelectRange.y1 + relativeCy * scaleY;

        // Adjust all points with both scales
        this.position = {
          ...this.position,
          x1: multiSelectRange.x1 + relativeX1 * scaleX,
          y1: multiSelectRange.y1 + relativeY1 * scaleY,
          x2: multiSelectRange.x1 + relativeX2 * scaleX,
          y2: multiSelectRange.y1 + relativeY2 * scaleY,
          crossPoints: [crossTargetPoint],
        };
      }
    }
  };

  getPosition = (): BasePosition => {
    if (this.type === "curve") {
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;

      const dots = 100;
      for (let i = 0; i <= dots; i++) {
        const t = i / dots;

        const controlX = MathUtils.getBezierControlPoint(
          0.5,
          this.position.crossPoints[0].cx,
          this.position.x1,
          this.position.x2
        );
        const controlY = MathUtils.getBezierControlPoint(
          0.5,
          this.position.crossPoints[0].cy,
          this.position.y1,
          this.position.y2
        );

        const x =
          Math.pow(1 - t, 2) * this.position.x1 + 2 * (1 - t) * t * controlX + Math.pow(t, 2) * this.position.x2;

        const y =
          Math.pow(1 - t, 2) * this.position.y1 + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * this.position.y2;

        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
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
      x1: left,
      y1: top,
      x2: right,
      y2: bottom,
    };
  };

  multiDragMode = (mode: boolean) => {
    this.isMultiDrag = mode;
  };

  multiDragEffect = () => {
    if (this.type === "line") {
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
    }

    if (this.type === "curve") {
      const points = [
        { x: this.position.x1, y: this.position.y1 },
        ...this.position.crossPoints.map(({ cx, cy }) => ({ x: cx, y: cy })),
        { x: this.position.x2, y: this.position.y2 },
      ];

      const dots = 50;

      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];

        for (let i = 0; i < dots; i++) {
          const x = current.x + ((next.x - current.x) / dots) * i;
        }
      }
    }
  };

  private getMouseHitControlPoint = (mousePosition: MousePoint) => {
    const { x: mouseX, y: mouseY } = mousePosition;

    const isMouseOnStartPoint =
      mouseX >= this.position.x1 - this.dragCornerRectSize / 2 &&
      mouseX < this.position.x1 + this.dragCornerRectSize / 2 &&
      mouseY >= this.position.y1 - this.dragCornerRectSize / 2 &&
      mouseY < this.position.y1 + this.dragCornerRectSize / 2;

    const isMouseOnCenterPoint = this.position.crossPoints.some(({ cx, cy }) => {
      return (
        mouseX >= cx - this.dragCornerRectSize / 2 &&
        mouseX < cx + this.dragCornerRectSize / 2 &&
        mouseY >= cy - this.dragCornerRectSize / 2 &&
        mouseY < cy + this.dragCornerRectSize / 2
      );
    });

    const isMouseOnEndPoint =
      mouseX >= this.position.x2 - this.dragCornerRectSize / 2 &&
      mouseX < this.position.x2 + this.dragCornerRectSize / 2 &&
      mouseY >= this.position.y2 - this.dragCornerRectSize / 2 &&
      mouseY < this.position.y2 + this.dragCornerRectSize / 2;

    if (isMouseOnStartPoint) {
      return {
        point: 0,
        coordinates: {
          x: this.position.x1,
          y: this.position.y1,
        },
      };
    }

    if (isMouseOnCenterPoint) {
      return {
        point: 1,
        coordinates: {
          x: this.position.crossPoints[0].cx,
          y: this.position.crossPoints[0].cy,
        },
      };
    }

    if (isMouseOnEndPoint) {
      return {
        point: 2,
        coordinates: {
          x: this.position.x2,
          y: this.position.y2,
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
    this.ctx.roundRect(this.hoverPosition.x - 7.5, this.hoverPosition.y - 7.5, 15, 15, 10);
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
    this.ctx.beginPath();
    this.ctx.moveTo(this.position.x1, this.position.y1);
    const test = [];

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
        const tension = 0.15;

        const prevPoint = allPoints[i - 1] || startPoint;
        const nextPoint = allPoints[i + 2] || endPoint;

        const cp1x = startPoint.x + (endPoint.x - prevPoint.x) * tension;
        const cp1y = startPoint.y + (endPoint.y - prevPoint.y) * tension;
        const cp2x = endPoint.x - (nextPoint.x - startPoint.x) * tension;
        const cp2y = endPoint.y - (nextPoint.y - startPoint.y) * tension;

        test.push([cp1x, cp1y, cp2x, cp2y]);

        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endPoint.x, endPoint.y);
      }
    }

    this.ctx.strokeStyle = this.color;
    this.ctx.stroke();
    this.ctx.closePath();

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
