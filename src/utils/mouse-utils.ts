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
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (!transform) {
      return { x: screenX, y: screenY };
    }

    // 줌과 이동 변환을 역으로 적용하여 논리 좌표 계산
    return {
      x: (screenX - transform.translateX) / transform.zoom,
      y: (screenY - transform.translateY) / transform.zoom,
    };
  };
}
