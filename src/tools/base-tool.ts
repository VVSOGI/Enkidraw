import { ActiveManager, ComponentManager } from "../managers";

export abstract class BaseTool {
  abstract readonly name: string; // 각 툴에서 정의해야 함

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected componentManager: ComponentManager;
  protected activeManager: ActiveManager;
  protected deleteCurrentTool: () => void;

  protected isDrawing: boolean = false;
  protected isActive: boolean = false;
  protected stageWidth!: number;
  protected stageHeight!: number;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    componentManager: ComponentManager,
    activeManager: ActiveManager,
    deleteCurrentTool: () => void
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.componentManager = componentManager;
    this.activeManager = activeManager;
    this.deleteCurrentTool = deleteCurrentTool;
  }

  // 툴 활성화/비활성화
  activate = () => {
    this.isActive = true;
    this.addEventListeners();
  };

  deactivate = () => {
    this.isActive = false;
    this.removeEventListeners();
    this.deleteCurrentTool();
  };

  resize = (stageWidth: number, stageHeight: number) => {
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
  };

  abstract onKeyDown(e: KeyboardEvent): void;
  abstract onMouseDown(e: MouseEvent): void;
  abstract onMouseMove(e: MouseEvent): void;
  abstract onMouseUp(e: MouseEvent): void;
  abstract draw(...props: any): void;

  private addEventListeners = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("keydown", this.onKeyDown);
  };

  private removeEventListeners = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("keydown", this.onKeyDown);
  };
}
