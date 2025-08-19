import { ComponentManager, LeftMenuManager } from ".";
import { BaseTool, DragTool, ZoomTool, HandTool, LineTool, RectTool } from "../tools";
import { CircleTool } from "../tools/circle-tool";
import { TextTool } from "../tools/text-tool";
import { ActiveManager } from "./active-manager";

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
  private rectTool: RectTool;
  private circleTool: CircleTool;
  private textTool: TextTool;

  private activeManager: ActiveManager;
  private componentManager: ComponentManager;
  private leftMenuManager: LeftMenuManager;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    this.ctx = ctx;

    this.resize();
    window.addEventListener("resize", this.resize);

    this.activeManager = new ActiveManager();
    this.leftMenuManager = new LeftMenuManager();
    this.componentManager = new ComponentManager(
      canvas,
      this.ctx,
      this.leftMenuManager,
      this.activeManager,
      this.getZoomTransform
    );

    this.zoomTool = new ZoomTool({
      canvas: this.canvas,
      ctx: this.ctx,
      activeManager: this.activeManager,
      componentManager: this.componentManager,
      selectTool: this.selectTool,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: () => {},
    });

    this.dragTool = new DragTool({
      canvas: this.canvas,
      ctx: this.ctx,
      activeManager: this.activeManager,
      componentManager: this.componentManager,
      selectTool: this.selectTool,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: this.getZoomTransform,
    });

    this.handTool = new HandTool({
      canvas: this.canvas,
      ctx: this.ctx,
      activeManager: this.activeManager,
      componentManager: this.componentManager,
      selectTool: this.selectTool,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: this.getZoomTransform,
      setZoomTransform: this.zoomTool.setTransform,
    });

    this.lineTool = new LineTool({
      canvas: this.canvas,
      ctx: this.ctx,
      activeManager: this.activeManager,
      leftMenuManager: this.leftMenuManager,
      componentManager: this.componentManager,
      selectTool: this.selectTool,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: this.getZoomTransform,
    });

    this.rectTool = new RectTool({
      canvas: this.canvas,
      ctx: this.ctx,
      activeManager: this.activeManager,
      componentManager: this.componentManager,
      selectTool: this.selectTool,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: this.getZoomTransform,
    });

    this.circleTool = new CircleTool({
      canvas: this.canvas,
      ctx: this.ctx,
      activeManager: this.activeManager,
      componentManager: this.componentManager,
      selectTool: this.selectTool,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: this.getZoomTransform,
    });

    this.textTool = new TextTool({
      canvas: this.canvas,
      ctx: this.ctx,
      activeManager: this.activeManager,
      componentManager: this.componentManager,
      selectTool: this.selectTool,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: this.getZoomTransform,
    });

    this.animationId = requestAnimationFrame(this.draw);

    this.zoomTool.activate();

    document.addEventListener("keydown", (e) => {
      if (e.code === "Escape") return;
      this.currentTool?.deactivate();

      if (e.code === "Digit1") {
        this.lineTool.activate();
        this.activeManager.selectCurrentActive("line");
      }

      if (e.code === "Digit2") {
        this.rectTool.activate();
        this.activeManager.selectCurrentActive("line");
      }

      if (e.code === "Digit3") {
        this.circleTool.activate();
        this.activeManager.selectCurrentActive("line");
      }

      if (e.code === "KeyH") {
        this.handTool.activate();
      }

      if (e.code === "KeyT") {
        this.textTool.activate();
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

    this.canvas.style.cursor = this.activeManager.setCursorStyle();

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(2, 2);
    this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);

    const transform = this.zoomTool.getTransform();
    this.ctx.translate(transform.translateX, transform.translateY);
    this.ctx.scale(transform.zoom, transform.zoom);

    if (this.activeManager.currentActive === "drag") {
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
