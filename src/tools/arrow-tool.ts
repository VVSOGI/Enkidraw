import { MousePoint } from "..";
import { BaseTool, BaseToolProps } from "./base-tool";

export class ArrowTool extends BaseTool {
  name: string = "arrow-tool";

  private initPoint: MousePoint | null = null;
  private movePoint: MousePoint | null = null;
  private points: MousePoint[] = [];

  constructor({
    canvas,
    ctx,
    activeManager,
    componentManager,
    selectTool,
    deleteCurrentTool,
    getZoomTransform,
  }: BaseToolProps) {
    super({
      canvas,
      ctx,
      activeManager,
      componentManager,
      selectTool,
      deleteCurrentTool,
      getZoomTransform,
    });
  }

  onMouseDown = (e: MouseEvent) => {};

  onMouseMove = (e: MouseEvent) => {};

  onMouseUp = (e: MouseEvent) => {};

  onKeyDown = (e: KeyboardEvent) => {};

  draw = () => {};

  reset = () => {
    this.isDrawing = false;
    this.initPoint = null;
    this.movePoint = null;
  };
}
