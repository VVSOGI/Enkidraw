import { ActiveManager, ComponentManager } from "..";

export interface BaseToolProps {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  activeManager: ActiveManager;
  componentManager: ComponentManager;
  selectTool: (tool: BaseTool) => void;
  deleteCurrentTool: () => void;
  getZoomTransform: () => { zoom: number; translateX: number; translateY: number };
}

export abstract class BaseTool {
  abstract readonly name: string; // 각 툴에서 정의해야 함

  public isActive: boolean = false;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected activeManager: ActiveManager;
  protected componentManager: ComponentManager;
  protected deleteCurrentTool: () => void;
  protected getZoomTransform: () => { zoom: number; translateX: number; translateY: number };
  protected selectTool: (tool: BaseTool) => void;

  protected isDrawing: boolean = false;
  protected stageWidth!: number;
  protected stageHeight!: number;

  constructor({
    canvas,
    ctx,
    activeManager,
    componentManager,
    selectTool,
    deleteCurrentTool,
    getZoomTransform,
  }: BaseToolProps) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.activeManager = activeManager;
    this.componentManager = componentManager;
    this.selectTool = selectTool;
    this.deleteCurrentTool = deleteCurrentTool;
    this.getZoomTransform = getZoomTransform;
  }

  // 줌을 고려한 마우스 좌표 계산
  protected getLogicalMousePos = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const transform = this.getZoomTransform?.();
    if (!transform) {
      return { x: screenX, y: screenY };
    }

    return {
      x: (screenX - transform.translateX) / transform.zoom,
      y: (screenY - transform.translateY) / transform.zoom,
    };
  };

  // 툴 활성화/비활성화
  activate = () => {
    this.isActive = true;
    this.addEventListeners();
    this.selectTool(this);
  };

  deactivate = () => {
    this.isActive = false;
    this.removeEventListeners();
    this.deleteCurrentTool();
    this.reset();
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
  abstract reset(): void;

  protected addEventListeners = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("keydown", this.onKeyDown);
  };

  protected removeEventListeners = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("keydown", this.onKeyDown);
  };
}
