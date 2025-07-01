import { ActiveManager } from "../managers";
import { v4 } from "uuid";
import { MousePoint } from "../types";

export interface BasePosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export abstract class BaseComponent<T extends BasePosition = BasePosition> {
  abstract readonly name: string;

  public readonly id = v4();
  public isActive: boolean = false;
  public isMultiDrag: boolean = false;
  public position: T;
  public originPosition: T;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected activeManager: ActiveManager;

  private multiDragPadding = 5;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, position: T, activeManager: ActiveManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.position = position;
    this.activeManager = activeManager;
    this.originPosition = position;
  }

  public activate = () => {
    this.isActive = true;
  };

  public deactivate = () => {
    this.isActive = false;
  };

  protected multiDragEffect = () => {
    const { x1, y1, x2, y2 } = this.getPosition();

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

  abstract multiDragMode(mode: boolean): void;
  abstract isHover(e: MouseEvent): boolean;
  abstract isClicked(e: MouseEvent): boolean;
  abstract hoverComponent(e: MouseEvent, move: MousePoint): void;
  abstract moveComponent(e: MouseEvent, move: MousePoint): void;
  abstract resizeComponent(newBounds: BasePosition): void;
  abstract initialPosition(): void;
  abstract getPosition(): BasePosition;
  abstract draw(): void;
}
