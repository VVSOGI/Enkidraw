import { BaseComponent, BasePosition } from "./base-component";

interface LinePosition extends BasePosition {
  cx: number;
  cy: number;
}

interface Props {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  position: LinePosition;
}

export class Line extends BaseComponent<LinePosition> {
  readonly name: string = "line";

  constructor({ canvas, ctx, position }: Props) {
    super(canvas, ctx, position);
  }

  onMouseDown = (e: MouseEvent) => {};
  onMouseMove = (e: MouseEvent) => {};
  onMouseUp = (e: MouseEvent) => {};

  getPosition = (): BasePosition => {
    return this.position;
  };

  setDragState = (state: boolean) => {
    this.isDrag = state;
    return this.isDrag;
  };

  private dragEffect = () => {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.position.x1, this.position.y1, 5, 0, Math.PI * 2);
    this.ctx.arc(this.position.x2, this.position.y2, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = "rgba(105, 105, 230, 0.5)";
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.position.x1, this.position.y1, 2.5, 0, Math.PI * 2);
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

    if (this.isDrag) {
      this.dragEffect();
    }
  };
}
