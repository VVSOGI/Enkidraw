export class ActiveManager {
  public currentActive: "default" | "move" | "pointer" | "drag" = "default";

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.activate();
  }

  public deactivate = () => {
    this.removeEventListeners();
  };

  public setDefault = () => {
    this.currentActive = "default";
  };

  public setCursorStyle = (style: "default" | "move" | "pointer") => {
    this.canvas.style.cursor = style;
  };

  public setDrag = () => {
    this.currentActive = "drag";
  };

  public setMove = () => {
    this.currentActive = "move";
  };

  private activate = () => {
    this.addEventListeners();
  };

  private onMouseMove = (e: MouseEvent) => {
    this.canvas.style.cursor = "default";
  };

  private onMouseDown = (e: MouseEvent) => {};

  private onMouseUp = (e: MouseEvent) => {};

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
