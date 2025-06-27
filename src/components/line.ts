import { BaseComponent } from "./base-component";

interface Props {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  position: {
    x1: number;
    y1: number;
    cx: number;
    cy: number;
    x2: number;
    y2: number;
  };
}

export class Line extends BaseComponent {
  name: string = "line";
  position: Props["position"];

  constructor({ canvas, ctx, position }: Props) {
    super(canvas, ctx);
    this.position = position;
  }

  onMouseDown = (e: MouseEvent) => {};
  onMouseMove = (e: MouseEvent) => {};
  onMouseUp = (e: MouseEvent) => {};

  draw = () => {
    this.ctx.beginPath();
    this.ctx.moveTo(this.position.x1, this.position.y1);
    this.ctx.lineTo(this.position.x2, this.position.y2);
    this.ctx.strokeStyle = "black";
    this.ctx.stroke();
    this.ctx.closePath();
  };
}
