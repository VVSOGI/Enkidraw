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
    if (!this.isActive || (e.code !== "Escape" && e.code !== "Escape")) {
      this.deleteCurrentTool();
      this.deactivate();
      return;
    }
  };

  reset = () => {};

  onMouseDown = (e: MouseEvent) => {};

  onMouseMove = (e: MouseEvent) => {};

  onMouseUp = (e: MouseEvent) => {};

  draw = () => {};
}
