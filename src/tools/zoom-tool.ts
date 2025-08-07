import { BaseTool, BaseToolProps } from "./base-tool";

interface ZoomToolProps extends BaseToolProps {}

export class ZoomTool extends BaseTool {
  public readonly name = "zoom";

  private zoomLevel: number = 1; // 100%
  private minZoom: number = 0.1; // 10%
  private maxZoom: number = 10; // 1000%
  private zoomStep: number = 0.1; // 10% 단위로 줌

  private transformX: number = 0;
  private transformY: number = 0;

  constructor({ canvas, ctx, activeManager, selectTool, deleteCurrentTool }: ZoomToolProps) {
    super({ canvas, ctx, activeManager, selectTool, deleteCurrentTool });
  }

  activate = () => {
    this.isActive = true;
    this.addBaseEventListeners();
    this.addZoomEventListeners();
  };

  deactivate = () => {
    this.isActive = false;
    this.removeBaseEventListeners();
    this.removeZoomEventListeners();
    this.deleteCurrentTool();
  };

  // 줌 레벨 조회 (퍼센트로 반환)
  getZoomPercent = (): number => {
    return Math.round(this.zoomLevel * 100);
  };

  // 줌 레벨 설정
  setZoomLevel = (zoomLevel: number) => {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoomLevel));
  };

  // 줌 리셋 (100%)
  resetZoom = () => {
    this.zoomLevel = 1;
    this.transformX = 0;
    this.transformY = 0;
  };

  onMouseDown = (e: MouseEvent) => {};

  onMouseMove = (e: MouseEvent) => {};

  onMouseUp = (e: MouseEvent) => {};

  onKeyDown = (e: KeyboardEvent) => {
    if (!this.isActive) return;

    if (e.key === "0") {
      e.preventDefault();
      this.resetZoom();
    }
  };

  draw = () => {};

  private onWheel = (e: WheelEvent) => {
    const isModifierPressed = e.metaKey || e.ctrlKey;
    if (!isModifierPressed) return;

    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const mousePos = {
      x: (screenX - this.transformX) / this.zoomLevel,
      y: (screenY - this.transformY) / this.zoomLevel,
    };

    const delta = e.deltaY;

    // 줌 인/아웃 계산
    let newZoomLevel = this.zoomLevel;
    if (delta < 0) {
      // 휠 위로 = 줌 인
      newZoomLevel = Math.min(this.maxZoom, this.zoomLevel + this.zoomStep);
    } else {
      // 휠 아래로 = 줌 아웃
      newZoomLevel = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
    }

    if (newZoomLevel === this.zoomLevel) return;

    // 마우스 위치 기준으로 줌
    const zoomRatio = newZoomLevel / this.zoomLevel;

    this.transformX = screenX - mousePos.x * newZoomLevel;
    this.transformY = screenY - mousePos.y * newZoomLevel;

    this.zoomLevel = newZoomLevel;
  };

  // 줌 변환 정보 조회
  getTransform = () => {
    return {
      zoom: this.zoomLevel,
      translateX: this.transformX,
      translateY: this.transformY,
    };
  };

  // 변환 상태 설정 (패닝 도구에서 사용)
  setTransform = (translateX: number, translateY: number, zoom?: number) => {
    this.transformX = translateX;
    this.transformY = translateY;
    if (zoom !== undefined) {
      this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    }
  };

  // 마우스 좌표를 논리 좌표로 역변환
  screenToLogical = (screenX: number, screenY: number) => {
    return {
      x: (screenX - this.transformX) / this.zoomLevel,
      y: (screenY - this.transformY) / this.zoomLevel,
    };
  };

  // 논리 좌표를 화면 좌표로 변환
  logicalToScreen = (logicalX: number, logicalY: number) => {
    return {
      x: logicalX * this.zoomLevel + this.transformX,
      y: logicalY * this.zoomLevel + this.transformY,
    };
  };

  private addBaseEventListeners = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("keydown", this.onKeyDown);
  };

  private removeBaseEventListeners = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("keydown", this.onKeyDown);
  };

  private addZoomEventListeners = () => {
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
  };

  private removeZoomEventListeners = () => {
    this.canvas.removeEventListener("wheel", this.onWheel);
  };
}
