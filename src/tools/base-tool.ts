import { BaseComponent } from "../components";
import { CursorManager } from "../managers";

export abstract class BaseTool {
  abstract readonly name: string; // 각 툴에서 정의해야 함

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected components: Set<BaseComponent> | null = null;
  protected cursorManager: CursorManager;
  protected deleteCurrentTool: () => void;

  protected isDrawing: boolean = false;
  protected isActive: boolean = false;
  protected stageWidth!: number;
  protected stageHeight!: number;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    components: Set<BaseComponent> | null,
    cursorManager: CursorManager,
    deleteCurrentTool: () => void
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.components = components;
    this.cursorManager = cursorManager;
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

  abstract onMouseDown(e: MouseEvent): void;
  abstract onMouseMove(e: MouseEvent): void;
  abstract onMouseUp(e: MouseEvent): void;
  abstract draw(...props: any): void;

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
