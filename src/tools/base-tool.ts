import { BaseComponent } from "../components";

export abstract class BaseTool {
  abstract readonly name: string; // 각 툴에서 정의해야 함

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected isDrawing: boolean = false;
  protected isActive: boolean = false;
  protected stageWidth!: number;
  protected stageHeight!: number;
  protected components: Set<BaseComponent> | null = null;
  protected deleteCurrentTool: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    components: Set<BaseComponent> | null,
    deleteCurrentTool: () => void
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.components = components;
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

  // 추상 메서드들 - 각 툴에서 구현 필요
  abstract onMouseDown(e: MouseEvent): void;
  abstract onMouseMove(e: MouseEvent): void;
  abstract onMouseUp(e: MouseEvent): void;
  abstract draw(...props: any): void;

  // 공통 이벤트 리스너 관리
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
