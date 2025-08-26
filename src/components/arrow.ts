import { DragRange, EdgeDirection, MousePoint } from "..";
import { BaseComponent, BaseComponentProps, BasePosition } from "./base-component";

export interface ArrowPosition extends BasePosition {
  crossPoints: {
    cx: number;
    cy: number;
  }[];
}

interface Props<T> extends BaseComponentProps<T> {}

export class Arrow extends BaseComponent<BasePosition> {
  name = "arrow-component";

  constructor({ canvas, ctx, position, getZoomTransform }: Props<ArrowPosition>) {
    super({ canvas, ctx, position, getZoomTransform });
  }

  initialPosition = () => {};

  getPosition = () => {
    return this.position;
  };

  isHover = (e: MouseEvent) => {
    return false;
  };

  isClicked = (e: MouseEvent) => {
    return false;
  };

  hoverComponent = (e: MouseEvent, move: MousePoint) => {};

  moveComponent = (e: MouseEvent, move: MousePoint) => {};

  resizeComponent = (mouseDistance: MousePoint, multiSelectRange: DragRange, edgeDirection: EdgeDirection) => {};

  getMultiSelectHoverZone = (mouse: MousePoint): EdgeDirection | "inside" | "outside" => {
    return "outside";
  };

  multiDragEffect = () => {};

  draw = () => {};
}
