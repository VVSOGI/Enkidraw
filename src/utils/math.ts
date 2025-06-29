import { BasePosition } from "../components";
import { MousePoint } from "../types";

export class MathUtils {
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
}
