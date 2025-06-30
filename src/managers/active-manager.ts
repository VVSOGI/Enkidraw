export class ActiveManager {
  public currentActive: "default" | "move" | "pointer" = "default";

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.activate();
  }

  public activate = () => {
    this.addEventListeners();
  };

  public deactivate = () => {
    this.removeEventListeners();
  };

  public setDefault = () => {
    this.currentActive = "default";
    this.canvas.style.cursor = "default";
  };

  public setMove = () => {
    this.currentActive = "move";
    this.canvas.style.cursor = "move";
  };

  public setPointer = () => {
    this.currentActive = "pointer";
    this.canvas.style.cursor = "pointer";
  };

  private onMouseMove = (e: MouseEvent) => {
    this.setDefault();
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
