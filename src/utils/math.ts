import { BasePosition, LinePosition } from "../components";
import { MousePoint } from "../types";

export class MathUtils {
  static getBezierCurve = (t: number, p0: number, p1: number, p2: number) => {
    return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
  };

  static getBezierControlPoint = (t: number, targetPoint: number, p0: number, p2: number) => {
    if (t === 0.5) {
      return 2 * targetPoint - 0.5 * (p0 + p2);
    }

    const oneMinusT = 1 - t;
    const denominator = 2 * oneMinusT * t;

    return (targetPoint - oneMinusT * oneMinusT * p0 - t * t * p2) / denominator;
  };

  static getDistanceLineFromPoint = (mousePosition: MousePoint, threshold: number, position: BasePosition) => {
    const { x, y } = mousePosition;
    const top = Math.min(position.y1, position.y2) - threshold / 2;
    const bottom = Math.max(position.y1, position.y2) + threshold / 2;
    const left = Math.min(position.x1, position.x2) - threshold / 2;
    const right = Math.max(position.x1, position.x2) + threshold / 2;

    if (x < left || x > right || y < top || y > bottom) {
      return threshold + 1;
    }

    const A = position.y2 - position.y1;
    const B = position.x1 - position.x2;
    const C = position.x2 * position.y1 - position.x1 * position.y2;

    return Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
  };

  static getDistanceCurveFromPoint = (mousePosition: MousePoint, position: LinePosition) => {
    const points = [
      { x: position.x1, y: position.y1 },
      ...position.crossPoints.map(({ cx, cy }) => ({ x: cx, y: cy })),
      { x: position.x2, y: position.y2 },
    ];
    const dots = 50;
    let minDistance = Infinity;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      const prevPoint = points[i - 1] || current;
      const nextPoint = points[i + 2] || next;

      const { cp1x, cp1y, cp2x, cp2y } = this.getSmoothCurveControlPoints(current, next, prevPoint, nextPoint);

      for (let j = 0; j < dots; j++) {
        const t = j / dots;

        const x = this.getCubicBezierCurve(t, current.x, cp1x, cp2x, next.x);
        const y = this.getCubicBezierCurve(t, current.y, cp1y, cp2y, next.y);
        const distance = Math.sqrt(Math.pow(mousePosition.x - x, 2) + Math.pow(mousePosition.y - y, 2));

        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    }

    return minDistance;
  };

  // 3차 베지어 곡선 (Cubic Bézier Curve)
  // B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
  static getCubicBezierCurve = (t: number, p0: number, p1: number, p2: number, p3: number) => {
    const oneMinusT = 1 - t;
    return (
      Math.pow(oneMinusT, 3) * p0 +
      3 * Math.pow(oneMinusT, 2) * t * p1 +
      3 * oneMinusT * Math.pow(t, 2) * p2 +
      Math.pow(t, 3) * p3
    );
  };

  // Smooth curve를 위한 tension 기반 제어점 계산
  static getSmoothCurveControlPoints = (
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    prevPoint: { x: number; y: number },
    nextPoint: { x: number; y: number }
  ) => {
    const tension = 0.15;

    return {
      cp1x: startPoint.x + (endPoint.x - prevPoint.x) * tension,
      cp1y: startPoint.y + (endPoint.y - prevPoint.y) * tension,
      cp2x: endPoint.x - (nextPoint.x - startPoint.x) * tension,
      cp2y: endPoint.y - (nextPoint.y - startPoint.y) * tension,
    };
  };

  static isPointBoundByEllipse({
    mouseX,
    mouseY,
    centerX,
    centerY,
    radiusX,
    radiusY,
    threshold = 1,
  }: {
    mouseX: number;
    mouseY: number;
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
    threshold: number;
  }) {
    return (
      Math.pow(mouseX - centerX, 2) / Math.pow(radiusX + threshold / 2, 2) +
        Math.pow(mouseY - centerY, 2) / Math.pow(radiusY + threshold / 2, 2) <=
      1
    );
  }
}
