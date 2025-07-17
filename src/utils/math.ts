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
    const { x, y } = mousePosition;

    const controlX = MathUtils.getBezierControlPoint(0.5, position.crossPoint[0].cx, position.x1, position.x2);
    const controlY = MathUtils.getBezierControlPoint(0.5, position.crossPoint[0].cy, position.y1, position.y2);

    const dots = 100;
    let minDistance = Infinity;

    for (let i = 0; i <= dots; i++) {
      const t = i / dots;
      const curveX = MathUtils.getBezierCurve(t, position.x1, controlX, position.x2);
      const curveY = MathUtils.getBezierCurve(t, position.y1, controlY, position.y2);
      const distance = Math.sqrt(Math.pow(x - curveX, 2) + Math.pow(y - curveY, 2));

      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance;
  };
}
