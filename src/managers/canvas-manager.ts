import { ComponentManager, LeftMenuManager } from ".";
import { BaseTool, DragTool, ZoomTool, HandTool, LineTool } from "../tools";

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stageWidth!: number;
  private stageHeight!: number;
  private animationId: number | null = null;

  private currentTool: BaseTool | null = null;
  private dragTool: DragTool;
  private zoomTool: ZoomTool;
  private handTool: HandTool;
  private lineTool: LineTool;

  private componentManager: ComponentManager;
  private leftMenuManager: LeftMenuManager;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    this.ctx = ctx;

    this.resize();
    window.addEventListener("resize", this.resize);

    this.leftMenuManager = new LeftMenuManager();
    this.componentManager = new ComponentManager(canvas, this.ctx, this.leftMenuManager, this.getZoomTransform);

    this.zoomTool = new ZoomTool({
      canvas: this.canvas,
      ctx: this.ctx,
      selectTool: this.selectTool,
      deleteCurrentTool: this.deleteCurrentTool,
    });

    this.dragTool = new DragTool({
      canvas: this.canvas,
      ctx: this.ctx,
      selectTool: this.selectTool,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: this.getZoomTransform,
    });

    this.handTool = new HandTool({
      canvas: this.canvas,
      ctx: this.ctx,
      selectTool: this.selectTool,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: this.getZoomTransform,
      setZoomTransform: this.zoomTool.setTransform,
    });

    this.lineTool = new LineTool({
      canvas: this.canvas,
      ctx: this.ctx,
      leftMenuManager: this.leftMenuManager,
      componentManager: this.componentManager,
      selectTool: this.selectTool,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: this.getZoomTransform,
    });

    this.animationId = requestAnimationFrame(this.draw);

    this.zoomTool.activate();

    document.addEventListener("keydown", (e) => {
      this.canvas.style.cursor = "default";

      if (e.key === "1") {
        this.lineTool.activate();
      }

      if (e.key === "h") {
        this.handTool.activate();
        this.canvas.style.cursor = "grab";
      }
    });
  }

  public destroy = () => {
    window.removeEventListener("resize", this.resize);
    this.dragTool.deactivate();
    this.zoomTool.deactivate();
    this.handTool.deactivate();

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  };

  // 줌 변환 정보를 다른 도구들이 접근할 수 있도록 하는 메서드
  public getZoomTransform = () => {
    return this.zoomTool.getTransform();
  };

  private deleteCurrentTool = () => {
    this.currentTool = null;
  };

  private selectTool = (tool: BaseTool) => {
    if (tool) {
      this.currentTool = tool;
    }
  };

  private resize = () => {
    this.stageWidth = this.canvas.clientWidth;
    this.stageHeight = this.canvas.clientHeight;

    this.canvas.width = this.stageWidth * 2;
    this.canvas.height = this.stageHeight * 2;
    this.ctx.scale(2, 2);
  };

  private draw = (t: number) => {
    requestAnimationFrame(this.draw);

    this.ctx.save();

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(2, 2);
    this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);

    const transform = this.zoomTool.getTransform();
    this.ctx.translate(transform.translateX, transform.translateY);
    this.ctx.scale(transform.zoom, transform.zoom);

    if (!this.currentTool) {
      const dragRange = this.dragTool.draw();
      if (dragRange) {
        this.componentManager.dragComponents(dragRange);
      }
    }

    if (this.currentTool) {
      this.currentTool.draw();
    }

    this.componentManager.draw();

    this.ctx.restore();
  };
}
