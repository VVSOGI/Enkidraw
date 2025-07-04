import { ActiveManager } from "../managers";
import { DragRange, EdgeDirection, MousePoint } from "../types";
import { MathUtils, MouseUtils } from "../utils";
import { BaseComponent, BasePosition } from "./base-component";

export interface LinePosition extends BasePosition {
  cx: number;
  cy: number;
}

interface Props {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  position: LinePosition;
  activeManager: ActiveManager;
}

export class Line extends BaseComponent<LinePosition> {
  readonly name: string = "line";

  private type: "line" | "curve" = "line";
  private threshold = 10;
  private dragCornerRectSize = 7.5;
  private moveCornorPoint = -1;
  private hoverPosition: MousePoint | null = null;

  constructor({ canvas, ctx, position, activeManager }: Props) {
    super(canvas, ctx, position, activeManager);
  }

  initialPosition = () => {
    this.originPosition = {
      x1: this.position.x1,
      y1: this.position.y1,
      cx: this.position.cx,
      cy: this.position.cy,
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
    if (this.moveCornorPoint > -1) {
      if (this.moveCornorPoint === 1) {
        this.position.cx = this.originPosition.cx + move.x;
        this.position.cy = this.originPosition.cy + move.y;
        this.hoverPosition = { x: this.position.cx, y: this.position.cy };
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

        this.position.cx = (this.position.x1 + this.position.x2) / 2;
        this.position.cy = (this.position.y1 + this.position.y2) / 2;

        return;
      }
    }

    this.position = {
      x1: this.originPosition.x1 + move.x,
      y1: this.originPosition.y1 + move.y,
      x2: this.originPosition.x2 + move.x,
      y2: this.originPosition.y2 + move.y,
      cx: this.originPosition.cx + move.x,
      cy: this.originPosition.cy + move.y,
    };
  };

  resizeComponent = (mouseDistance: MousePoint, multiSelectRange: DragRange, edgeDirection: EdgeDirection) => {
    /** Line */
    /**
     * 좌우 리사이즈일 때
     * totalX
     */
    if (edgeDirection === "right") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX + mouseDistance.x;
      const scale = newTotalRangeX / totalRangeX;

      // 선택 영역의 시작점(x1)을 기준으로 상대적 위치를 계산하여 스케일 적용
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
      const relativeCx = this.originPosition.cx - multiSelectRange.x1;

      this.position = {
        ...this.position,
        x2: multiSelectRange.x1 + relativeX2 * scale,
        cx: multiSelectRange.x1 + relativeCx * scale,
      };
    }

    if (edgeDirection === "left") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX - mouseDistance.x;
      const scale = newTotalRangeX / totalRangeX;

      // 선택 영역의 끝점(x2)을 기준으로 상대적 위치를 계산하여 스케일 적용
      const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
      const relativeCx = this.originPosition.cx - multiSelectRange.x2;

      this.position = {
        ...this.position,
        x1: multiSelectRange.x2 + relativeX1 * scale,
        cx: multiSelectRange.x2 + relativeCx * scale,
      };
    }

    if (edgeDirection === "top") {
      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY - mouseDistance.y;
      const scale = newTotalRangeY / totalRangeY;

      // 선택 영역의 끝점(y2)을 기준으로 상대적 위치를 계산
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

      this.position = {
        ...this.position,
        y1: multiSelectRange.y2 + relativeY1 * scale,
        y2: multiSelectRange.y2 + relativeY2 * scale,
        cy: multiSelectRange.y2 + relativeY2 * scale,
      };
    }

    /**
     * 상하 리사이즈일 때
     */
    /**
     * 대각선 리사이즈일 때
     */
    /***************************** */
    /***************************** */
    /** Curve */
    /**
     * 좌우 리사이즈일 때
     * totalX
     */
    /**
     * 상하 리사이즈일 때
     */
    /**
     * 대각선 리사이즈일 때
     */
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

        const controlX = MathUtils.getBezierControlPoint(0.5, this.position.cx, this.position.x1, this.position.x2);
        const controlY = MathUtils.getBezierControlPoint(0.5, this.position.cy, this.position.y1, this.position.y2);

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
    const { x1, y1, x2, y2 } = this.getPosition();
    1;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(x1 - this.multiDragPadding, y1 - this.multiDragPadding);
    this.ctx.lineTo(x2 + this.multiDragPadding, y1 - this.multiDragPadding);
    this.ctx.lineTo(x2 + this.multiDragPadding, y2 + this.multiDragPadding);
    this.ctx.lineTo(x1 - this.multiDragPadding, y2 + this.multiDragPadding);
    this.ctx.lineTo(x1 - this.multiDragPadding, y1 - this.multiDragPadding);
    this.ctx.strokeStyle = "rgba(105, 105, 230, 0.5)";
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  private getMouseHitControlPoint = (mousePosition: MousePoint) => {
    const { x: mouseX, y: mouseY } = mousePosition;

    const isMouseOnStartPoint =
      mouseX >= this.position.x1 - this.dragCornerRectSize / 2 &&
      mouseX < this.position.x1 + this.dragCornerRectSize / 2 &&
      mouseY >= this.position.y1 - this.dragCornerRectSize / 2 &&
      mouseY < this.position.y1 + this.dragCornerRectSize / 2;

    const isMouseOnCenterPoint =
      mouseX >= this.position.cx - this.dragCornerRectSize / 2 &&
      mouseX < this.position.cx + this.dragCornerRectSize / 2 &&
      mouseY >= this.position.cy - this.dragCornerRectSize / 2 &&
      mouseY < this.position.cy + this.dragCornerRectSize / 2;

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
          x: this.position.cx,
          y: this.position.cy,
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
    this.ctx.fillStyle = "rgba(105, 105, 230, 0.5)";
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
    this.ctx.roundRect(
      this.position.cx + this.dragCornerRectSize / 2,
      this.position.cy + this.dragCornerRectSize / 2,
      -this.dragCornerRectSize,
      -this.dragCornerRectSize,
      4
    );
    this.ctx.roundRect(
      this.position.x2 + this.dragCornerRectSize / 2,
      this.position.y2 + this.dragCornerRectSize / 2,
      -this.dragCornerRectSize,
      -this.dragCornerRectSize,
      4
    );
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(105, 105, 230, 0.5)";
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  draw = () => {
    const controlX = MathUtils.getBezierControlPoint(0.5, this.position.cx, this.position.x1, this.position.x2);
    const controlY = MathUtils.getBezierControlPoint(0.5, this.position.cy, this.position.y1, this.position.y2);

    this.ctx.beginPath();
    this.ctx.moveTo(this.position.x1, this.position.y1);
    this.ctx.quadraticCurveTo(controlX, controlY, this.position.x2, this.position.y2);
    this.ctx.strokeStyle = "black";
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
