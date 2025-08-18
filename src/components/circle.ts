import { v4 } from "uuid";
import { BaseComponent, BaseComponentProps, BasePosition } from ".";
import { DragRange, EdgeDirection, MousePoint } from "..";

export class Circle extends BaseComponent {
  public id: string = v4();
  public name: string = "circle";

  constructor({ canvas, ctx, position, getZoomTransform }: BaseComponentProps<BasePosition>) {
    super({ canvas, ctx, position, getZoomTransform });
  }

  initialPosition = () => {
    return this.position;
  };

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
