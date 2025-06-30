import { CursorManager } from "../managers";
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
  cursorManager: CursorManager;
}

export class Line extends BaseComponent<LinePosition> {
  readonly name: string = "line";

  private threshold = 10;

  constructor({ canvas, ctx, position, cursorManager }: Props) {
    super(canvas, ctx, position, cursorManager);
  }

  onMouseDown = (e: MouseEvent) => {};
  onMouseMove = (e: MouseEvent) => {
    // 컴포넌트를 클릭하거나 드래그 범위에 포함되었을 때
    if (this.isActive) {
      const mousePosition = MouseUtils.getMousePos(e, this.canvas);
      const distance = MathUtils.getDistanceLineFromPoint(mousePosition, this.threshold, this.position);
      if (distance <= this.threshold) {
        this.cursorManager.setMove();
      }

      return;
    }

    // 컴포넌트가 클릭 및 드래그 되지 않은 기본 상태
    const mousePosition = MouseUtils.getMousePos(e, this.canvas);
    const distance = MathUtils.getDistanceLineFromPoint(mousePosition, this.threshold, this.position);

    if (distance <= this.threshold) {
      this.cursorManager.setPointer();
    }
  };
  onMouseUp = (e: MouseEvent) => {};

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

    if (this.isActive) {
      this.dragEffect();
    }
  };
}
