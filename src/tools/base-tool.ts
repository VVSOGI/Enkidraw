import { ActiveManager } from "../managers";
import { ToolNames } from "../types";

export interface BaseToolProps {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  activeManager: ActiveManager;
  selectTool: (name: ToolNames) => void;
  deleteCurrentTool: () => void;
  getZoomTransform?: () => { zoom: number; translateX: number; translateY: number };
}

export abstract class BaseTool {
  abstract readonly name: string; // 각 툴에서 정의해야 함

  protected canvas: BaseToolProps["canvas"];
  protected ctx: BaseToolProps["ctx"];
  protected activeManager: BaseToolProps["activeManager"];
  protected selectTool: BaseToolProps["selectTool"];
  protected deleteCurrentTool: BaseToolProps["deleteCurrentTool"];
  protected getZoomTransform?: BaseToolProps["getZoomTransform"];

  protected isDrawing: boolean = false;
  protected isActive: boolean = false;
  protected stageWidth!: number;
  protected stageHeight!: number;

  constructor({ canvas, ctx, activeManager, selectTool, deleteCurrentTool, getZoomTransform }: BaseToolProps) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.activeManager = activeManager;
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
  };

  deactivate = () => {
    this.isActive = false;
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

  protected addEventListeners = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
  };

  protected removeEventListeners = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
  };
}
