import { ActiveManager } from "../managers";
import { MousePoint } from "../types";
import { MathUtils, MouseUtils } from "../utils";
import { BaseComponent, BasePosition } from "./base-component";

interface LinePosition extends BasePosition {
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
  private dragCornerRectSize = 10;
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
    const mousePosition = MouseUtils.getMousePos(e, this.canvas);
    const distance = MathUtils.getDistanceLineFromPoint(mousePosition, this.threshold, this.position);
    if (distance <= this.threshold) {
      return true;
    }

    return false;
  };

  isClicked = (e: MouseEvent) => {
    const mousePosition = MouseUtils.getMousePos(e, this.canvas);
    const distance = MathUtils.getDistanceLineFromPoint(mousePosition, this.threshold, this.position);
    if (distance <= this.threshold) {
      const { point } = this.getMouseHitControlPoint(mousePosition);
      if (point > -1) {
        this.moveCornorPoint = point;
      }
      return true;
    }

    return false;
  };

  hoverComponent = (move: MousePoint) => {
    if (this.isActive) {
      const { point, coordinates } = this.getMouseHitControlPoint(move);
      if (point > -1) {
        this.hoverPosition = coordinates as MousePoint;
        this.activeManager.setCursorStyle("pointer");
        return;
      } else {
        this.hoverPosition = null;
      }

      this.activeManager.setCursorStyle("move");
    } else {
      this.activeManager.setCursorStyle("pointer");
    }
  };

  moveComponent = (move: MousePoint) => {
    if (this.moveCornorPoint > -1) {
      if (this.type === "line") {
        if (this.moveCornorPoint === 0) {
          this.position.x1 = this.originPosition.x1 + move.x;
          this.position.y1 = this.originPosition.y1 + move.y;
          // this.hoverEndpoint = { x: this.position.x1, y: this.position.y1 };
        }

        if (this.moveCornorPoint === 2) {
          this.position.x2 = this.originPosition.x2 + move.x;
          this.position.y2 = this.originPosition.y2 + move.y;
          // this.hoverEndpoint = { x: this.position.x2, y: this.position.y2 };
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

  getPosition = (): BasePosition => {
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
    this.ctx.arc(this.position.x1, this.position.y1, 5, 0, Math.PI * 2);
    this.ctx.arc(this.position.cx, this.position.cy, 5, 0, Math.PI * 2);
    this.ctx.arc(this.position.x2, this.position.y2, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = "rgba(105, 105, 230, 0.5)";
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.position.x1, this.position.y1, 2.5, 0, Math.PI * 2);
    this.ctx.arc(this.position.cx, this.position.cy, 2.5, 0, Math.PI * 2);
    this.ctx.arc(this.position.x2, this.position.y2, 2.5, 0, Math.PI * 2);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  };

  draw = () => {
    this.ctx.beginPath();
    this.ctx.moveTo(this.position.x1, this.position.y1);
    this.ctx.lineTo(this.position.x2, this.position.y2);
    this.ctx.strokeStyle = "black";
    this.ctx.stroke();
    this.ctx.closePath();

    if (this.hoverPosition) {
      this.hoverPointEffect();
    }

    if (this.isActive) {
      this.dragEffect();
    }
  };
}
