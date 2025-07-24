import { CursorStyle } from "../types";

type ActiveMode = "default" | "move" | "pointer" | "drag" | "resize" | "hand";

export class ActiveManager {
  public currentActive: ActiveMode = "default";

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected isMouseDown: boolean = false;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.activate();
  }

  public deactivate = () => {
    this.removeEventListeners();
  };

  public setMode = (mode: ActiveMode) => {
    this.currentActive = mode;
  };

  public setCursorStyle = (style: CursorStyle) => {
    this.canvas.style.cursor = style;
  };

  private activate = () => {
    this.addEventListeners();
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.currentActive === "hand") {
      if (this.isMouseDown) {
        this.setCursorStyle("grabbing");
      } else {
        this.setCursorStyle("grab");
      }

      return;
    }

    this.setCursorStyle("default");
  };

  private onMouseDown = (e: MouseEvent) => {
    this.isMouseDown = true;

    switch (this.currentActive) {
      case "hand":
        this.setCursorStyle("grabbing");
        return;
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    this.isMouseDown = false;

    switch (this.currentActive) {
      case "hand":
        this.setCursorStyle("grab");
        return;

      case "drag":
        this.setMode("default");
        return;
    }
  };

  private addEventListeners = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
  };

  private removeEventListeners = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
  };
}
