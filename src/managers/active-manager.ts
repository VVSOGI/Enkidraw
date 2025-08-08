import { CursorStyle } from "../types";

type ActiveMode = "default" | "move" | "pointer" | "drag" | "resize" | "hand";

export class ActiveManager {
  public currentActive: ActiveMode = "default";

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  public setMode = (mode: ActiveMode) => {
    this.currentActive = mode;
  };

  public setCursorStyle = (style: CursorStyle) => {
    this.canvas.style.cursor = style;
  };
}
