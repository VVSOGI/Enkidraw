export interface MousePoint {
  x: number;
  y: number;
}

export interface DragRange {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type EdgeDirection =
  | "right"
  | "left"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type Active = "default" | "line" | "move" | "resize" | "pointer" | "drag";
