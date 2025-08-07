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
  }

  activate = () => {
    this.isActive = true;
    this.activeManager.setMode("default");
    this.addHandEventListeners();
    this.setHandCursor();
  };

  deactivate = () => {
    this.isActive = false;
    this.removeHandEventListeners();
    this.resetCursor();
    this.deleteCurrentTool();
  };

  onMouseDown = (e: MouseEvent) => {
    if (!this.isActive) return;

    this.isDragging = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastMousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    this.setGrabbingCursor();
    e.preventDefault();
  };

  onMouseMove = (e: MouseEvent) => {
    if (!this.isActive || !this.isDragging || !this.lastMousePos) return;

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

    e.preventDefault();
  };

  onMouseUp = (e: MouseEvent) => {
    if (!this.isActive) return;

    this.isDragging = false;
    this.lastMousePos = null;
    this.setHandCursor();
    e.preventDefault();
  };

  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "h") {
    }

    if (e.key === "Escape") {
      e.preventDefault();
      this.deactivate();
    }
  };

  draw = () => {};

  private setHandCursor = () => {
    this.canvas.style.cursor = "grab";
  };

  private setGrabbingCursor = () => {
    this.canvas.style.cursor = "grabbing";
  };

  // 커서 리셋
  private resetCursor = () => {
    this.canvas.style.cursor = "default";
  };

  private addHandEventListeners = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("keydown", this.onKeyDown);
  };

  private removeHandEventListeners = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("keydown", this.onKeyDown);
  };
}
