import { BaseTool, BaseToolProps } from "./base-tool";

interface RectToolProps extends BaseToolProps {}

export class RectTool extends BaseTool {
  public readonly name: string = "rect";

  constructor({ canvas, ctx, selectTool, deleteCurrentTool, getZoomTransform, activeManager }: RectToolProps) {
    super({ canvas, ctx, selectTool, deleteCurrentTool, getZoomTransform, activeManager });
  }

  activate = () => {
    this.isActive = true;
    this.addEventListeners();
    this.selectTool(this);
  };

  onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Escape") {
      this.deactivate();
    }
  };

  reset = () => {};

  onMouseDown = (e: MouseEvent) => {
    console.log("Rect Down");
    this.isDrawing = true;
    this.activeManager.selectCurrentActive("line");
  };

  onMouseMove = (e: MouseEvent) => {
    if (this.isDrawing) {
      console.log("Rect Drawing");
    } else {
      console.log("Rect move");
    }
  };

  onMouseUp = (e: MouseEvent) => {
    console.log("Rect up");
    this.isDrawing = false;
  };

  draw = () => {};
}
