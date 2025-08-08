import { v4 } from "uuid";
import { DragRange, EdgeDirection, MousePoint } from "../types";
import { STYLE_SYSTEM } from "../utils";

export interface BasePosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface BaseComponentProps<T> {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  position: T;
  getZoomTransform: () => { zoom: number; translateX: number; translateY: number };
}

export abstract class BaseComponent<T extends BasePosition = BasePosition> {
  abstract readonly name: string;

  public readonly id = v4();
  public isActive: boolean = false;
  public isMultiDrag: boolean = false;
  public position: T;
  public originPosition: T;
  public color = STYLE_SYSTEM.BLACK;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected multiDragPadding = 5;
  protected getZoomTransform?: () => { zoom: number; translateX: number; translateY: number };

  constructor({ canvas, ctx, position, getZoomTransform }: BaseComponentProps<T>) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.position = position;
    this.originPosition = position;
    this.getZoomTransform = getZoomTransform;
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
  abstract resizeComponent(mouseDistance: MousePoint, multiSelectRange: DragRange, edgeDirection: EdgeDirection): void;
  abstract initialPosition(): void;
  abstract getPosition(): BasePosition;
  abstract draw(): void;
}
