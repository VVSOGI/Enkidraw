import { CursorManager } from "../managers";

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
  protected isActive: boolean = false;
  protected position: T;
  protected cursorManager: CursorManager;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, position: T, cursorManager: CursorManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.position = position;
    this.cursorManager = cursorManager;
  }

  public activate = () => {
    this.isActive = true;
  };

  public deactivate = () => {
    this.isActive = false;
  };

  abstract onMouseDown(e: MouseEvent): void;
  abstract onMouseMove(e: MouseEvent): void;
  abstract onMouseUp(e: MouseEvent): void;
  abstract getPosition(): BasePosition;
  abstract draw(): void;

  public addEventListeners = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
  };

  public removeEventListeners = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
  };
}
