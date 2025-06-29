export interface BasePosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export abstract class BaseComponent<T extends BasePosition = BasePosition> {
  abstract readonly name: string;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected isDrag: boolean = false;
  protected position: T;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, position: T) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.position = position;
  }

  abstract onMouseDown(e: MouseEvent): void;
  abstract onMouseMove(e: MouseEvent): void;
  abstract onMouseUp(e: MouseEvent): void;

  abstract getPosition(): BasePosition;
  abstract setDragState(state: boolean): boolean;

  abstract draw(): void;
}
