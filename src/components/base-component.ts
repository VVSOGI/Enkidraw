import { ActiveManager } from "../managers";
import { v4 } from "uuid";
import { EdgeDirection, MousePoint } from "../types";

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
  protected multiDragPadding = 5;

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

  abstract multiDragEffect(): void;
  abstract multiDragMode(mode: boolean): void;
  abstract isHover(e: MouseEvent): boolean;
  abstract isClicked(e: MouseEvent): boolean;
  abstract hoverComponent(e: MouseEvent, move: MousePoint): void;
  abstract moveComponent(e: MouseEvent, move: MousePoint): void;
  abstract resizeComponent(mouseDistance: MousePoint, edgeDirection: EdgeDirection): void;
  abstract initialPosition(): void;
  abstract getPosition(): BasePosition;
  abstract draw(): void;
}
