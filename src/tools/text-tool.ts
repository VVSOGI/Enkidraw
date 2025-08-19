import { MousePoint } from "../types";
import { MouseUtils, TimeUtils } from "../utils";
import { BaseTool, BaseToolProps } from "./base-tool";

export class TextTool extends BaseTool {
  name: string = "text-tool";
  currentText: string = "";
  firstDown: { position: MousePoint; time: Date } | null = null;
  secondDown: { position: MousePoint; time: Date } | null = null;

  constructor({
    canvas,
    ctx,
    activeManager,
    componentManager,
    selectTool,
    deleteCurrentTool,
    getZoomTransform,
  }: BaseToolProps) {
    super({ canvas, ctx, activeManager, componentManager, selectTool, deleteCurrentTool, getZoomTransform });
  }

  onMouseDown = (e: MouseEvent) => {
    const position = MouseUtils.getMousePos(e, this.canvas);
    const down = {
      position,
      time: new Date(),
    };

    if (!this.firstDown) {
      this.firstDown = down;
      return;
    }

    if (
      this.firstDown.position.x === down.position.x &&
      this.firstDown.position.y === down.position.y &&
      TimeUtils.isWithingTimeLimit(this.firstDown.time, down.time, 1)
    ) {
      console.log("can create");
    }
  };

  onMouseMove = (e: MouseEvent) => {};

  onMouseUp = (e: MouseEvent) => {};

  onKeyDown = (e: KeyboardEvent) => {};

  draw = () => {};

  reset = () => {};
}
