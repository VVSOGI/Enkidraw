import { ComponentManager, ActiveManager, LeftMenuManager } from ".";
import { BaseTool, DragTool, ZoomTool } from "../tools";
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
  private zoomTool: ZoomTool;
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
    this.componentManager = new ComponentManager(
      canvas,
      this.ctx,
      this.activeManager,
      this.leftMenuManager,
      this.getZoomTransform
    );
    this.zoomTool = new ZoomTool({
      canvas: this.canvas,
      ctx: this.ctx,
      activeManager: this.activeManager,
      deleteCurrentTool: this.deleteCurrentTool,
    });
    this.dragTool = new DragTool({
      canvas: this.canvas,
      ctx: this.ctx,
      activeManager: this.activeManager,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: this.getZoomTransform,
    });

    this.zoomTool.activate();
    this.animationId = requestAnimationFrame(this.draw);
  }

  public destroy = () => {
    window.removeEventListener("resize", this.resize);
    this.dragTool.deactivate();
    this.zoomTool.deactivate();
    this.activeManager.deactivate();

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  };

  // 줌 변환 정보를 다른 도구들이 접근할 수 있도록 하는 메서드
  public getZoomTransform = () => {
    return this.zoomTool.getTransform();
  };

  public addTool = (ToolClass: ToolConstructor, button?: HTMLElement) => {
    const tool = new ToolClass({
      canvas: this.canvas,
      ctx: this.ctx,
      componentManager: this.componentManager,
      activeManager: this.activeManager,
      leftMenuManager: this.leftMenuManager,
      deleteCurrentTool: this.deleteCurrentTool,
      getZoomTransform: this.getZoomTransform,
    });
    const toolName = tool.name as ToolNames;

    if (toolName === "drag" || toolName === "zoom") {
      console.info(`${toolName} is automatically applied without buttons.`);
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

    // 컨텍스트 상태 저장
    this.ctx.save();

    // 캔버스 초기화
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(2, 2); // 기본 레티나 디스플레이 스케일
    this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);

    // 줌 변환 적용
    const transform = this.zoomTool.getTransform();
    this.ctx.translate(transform.translateX, transform.translateY);
    this.ctx.scale(transform.zoom, transform.zoom);

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

    // 컨텍스트 상태 복원
    this.ctx.restore();
  };
}
