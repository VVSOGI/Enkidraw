import { MousePoint } from "../types";
import { MouseUtils, TimeUtils } from "../utils";
import { BaseTool, BaseToolProps } from "./base-tool";

export class TextTool extends BaseTool {
  name: string = "text-tool";
  currentText: string = "";
  firstDown: { position: MousePoint; time: Date } | null = null;

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

    if (!TimeUtils.isWithingTimeLimit(this.firstDown.time, down.time, 1)) {
      this.firstDown = null;
      return;
    }

    if (
      this.firstDown.position.x === down.position.x &&
      this.firstDown.position.y === down.position.y &&
      TimeUtils.isWithingTimeLimit(this.firstDown.time, down.time, 1)
    ) {
      this.createTextarea(down.position);
      this.firstDown = null;
    }
  };

  createTextarea = (position: MousePoint) => {
    // const textarea = document.createElement("textarea");
    // textarea.name = "textarea";
    // textarea.style.position = "absolute";
    // textarea.style.top = `${position.y}px`;
    // textarea.style.left = `${position.x}px`;
    // textarea.style.padding = "4px 8px";
    // textarea.style.resize = "none";
    // textarea.style.outline = "none";
    // textarea.style.border = "none";
    // textarea.style.backgroundColor = "transparent";
    // textarea.style.fontSize = "18px";
    // textarea.focus();
    // document.body.appendChild(textarea);
  };

  onMouseMove = (e: MouseEvent) => {};

  onMouseUp = (e: MouseEvent) => {};

  onKeyDown = (e: KeyboardEvent) => {};

  draw = () => {};

  reset = () => {};
}
