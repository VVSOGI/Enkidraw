export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stageWidth!: number;
  private stageHeight!: number;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    this.ctx = ctx;

    this.resize();
    window.addEventListener("resize", this.resize);

    this.animationId = requestAnimationFrame(this.draw);
  }

  private resize = () => {
    this.stageWidth = this.canvas.clientWidth;
    this.stageHeight = this.canvas.clientHeight;

    this.canvas.width = this.stageWidth * 2;
    this.canvas.height = this.stageHeight * 2;
    this.ctx.scale(2, 2);
  };

  private draw = (t: number) => {
    requestAnimationFrame(this.draw);

    this.ctx.arc(this.stageWidth / 2, this.stageHeight / 2, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = "black";
    this.ctx.fill();
  };

  destroy = () => {
    window.removeEventListener("resize", this.resize);
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  };
}
