import { BaseTool, BaseToolProps } from "./base-tool";

interface HandToolProps extends BaseToolProps {
  setZoomTransform: (translateX: number, translateY: number, zoom?: number) => void;
  getZoomTransform: () => { zoom: number; translateX: number; translateY: number };
}

export class HandTool extends BaseTool {
  public readonly name = "hand";

  private isDragging: boolean = false;
  private lastMousePos: { x: number; y: number } | null = null;
  private setZoomTransform: (translateX: number, translateY: number, zoom?: number) => void;
  protected getZoomTransform: () => { zoom: number; translateX: number; translateY: number };

  constructor({ canvas, ctx, activeManager, deleteCurrentTool, setZoomTransform, getZoomTransform }: HandToolProps) {
    super({ canvas, ctx, activeManager, deleteCurrentTool });
    this.setZoomTransform = setZoomTransform;
    this.getZoomTransform = getZoomTransform;
    document.addEventListener("keydown", this.onKeyDown);
  }

  activate = () => {
    this.isActive = true;
    this.addHandEventListeners();
    this.activeManager.setMode("hand");
    this.activeManager.setCursorStyle("grab");
  };

  deactivate = () => {
    this.isActive = false;
    this.lastMousePos = null;
  };

  onMouseDown = (e: MouseEvent) => {
    if (!this.isActive) return;

    this.isDragging = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastMousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  onMouseMove = (e: MouseEvent) => {
    if (!this.isActive) return;

    this.activeManager.setCursorStyle("grab");

    if (!this.isDragging || !this.lastMousePos) return;

    this.activeManager.setCursorStyle("grabbing");
    const rect = this.canvas.getBoundingClientRect();
    const currentMousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const deltaX = currentMousePos.x - this.lastMousePos.x;
    const deltaY = currentMousePos.y - this.lastMousePos.y;

    const currentTransform = this.getZoomTransform();
    this.setZoomTransform(currentTransform.translateX + deltaX, currentTransform.translateY + deltaY);
    this.lastMousePos = currentMousePos;
  };

  onMouseUp = (e: MouseEvent) => {
    if (!this.isActive) return;

    this.isDragging = false;
    this.lastMousePos = null;
    this.activeManager.setCursorStyle("grab");
  };

  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "h") {
      this.activate();
    }

    if (this.activeManager.currentActive === "hand" && e.key === "Escape") {
      e.preventDefault();
      this.deactivate();
      this.activeManager.setMode("default");
      this.activeManager.setCursorStyle("default");
    }
  };

  draw = () => {};

  private addHandEventListeners = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
  };

  private removeHandEventListeners = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("keydown", this.onKeyDown);
  };
}
