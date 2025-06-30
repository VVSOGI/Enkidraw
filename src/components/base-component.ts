import { ActiveManager } from "../managers";

export interface BasePosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export abstract class BaseComponent<T extends BasePosition = BasePosition> {
  abstract readonly name: string;

  public isActive: boolean = false;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected position: T;
  protected activeManager: ActiveManager;
  protected originPosition: T;

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

  abstract isHover(e: MouseEvent): boolean;
  abstract onMouseDown(e: MouseEvent): void;
  abstract onMouseMove(e: MouseEvent): void;
  abstract onMouseUp(e: MouseEvent): void;
  abstract getPosition(): BasePosition;
  abstract draw(): void;
}
