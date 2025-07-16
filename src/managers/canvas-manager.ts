import { ComponentManager, ActiveManager, LeftMenuManager } from ".";
import { BaseTool, DragTool } from "../tools";
import { ToolConstructor, ToolNames } from "../types";

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stageWidth!: number;
  private stageHeight!: number;
  private animationId: number | null = null;

  private tools: Map<ToolNames, BaseTool> = new Map();
  private currentTool: BaseTool | null = null;
  private dragTool: DragTool;
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

    this.leftMenuManager = new LeftMenuManager();
    this.activeManager = new ActiveManager(canvas, this.ctx);
    this.componentManager = new ComponentManager(canvas, this.ctx, this.activeManager, this.leftMenuManager);
    this.dragTool = new DragTool(
      this.canvas,
      this.ctx,
      this.componentManager,
      this.activeManager,
      this.deleteCurrentTool
    );

    this.animationId = requestAnimationFrame(this.draw);
  }

  public destroy = () => {
    window.removeEventListener("resize", this.resize);
    this.dragTool.deactivate();
    this.activeManager.deactivate();

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  };

  public addTool = (ToolClass: ToolConstructor, button?: HTMLElement) => {
    const tool = new ToolClass(
      this.canvas,
      this.ctx,
      this.componentManager,
      this.activeManager,
      this.deleteCurrentTool,
      this.leftMenuManager
    );
    const toolName = tool.name as ToolNames;

    if (toolName === "drag") {
      console.info("Drag is automatically applied without buttons.");
      return;
    }

    tool.resize(this.stageWidth, this.stageHeight);
    this.tools.set(toolName, tool);

    if (button) {
      button.addEventListener("click", () => this.selectTool(toolName));
    }

    return this;
  };

  private deleteCurrentTool = () => {
    this.currentTool = null;
  };

  private selectTool = (name: ToolNames) => {
    if (this.currentTool) {
      this.currentTool.deactivate();
    }

    const tool = this.tools.get(name);

    if (tool) {
      this.currentTool = tool;
      tool.activate();
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
    this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);

    if (!this.currentTool && this.activeManager.currentActive === "drag") {
      const dragRange = this.dragTool.draw();
      if (dragRange) {
        this.componentManager.dragComponents(dragRange);
      }
    }

    if (this.currentTool) {
      this.currentTool.draw();
    }

    this.componentManager.draw();
  };
}
