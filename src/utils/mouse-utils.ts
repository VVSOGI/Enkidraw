export class MouseUtils {
  static getMousePos = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // 줌 변환을 고려한 논리 좌표 계산
  static getLogicalMousePos = (
    e: MouseEvent,
    canvas: HTMLCanvasElement,
    transform?: { zoom: number; translateX: number; translateY: number }
  ) => {
    const { x, y } = this.getMousePos(e, canvas);

    if (!transform) {
      return { x, y };
    }

    return {
      x: (x - transform.translateX) / transform.zoom,
      y: (y - transform.translateY) / transform.zoom,
    };
  };
}
