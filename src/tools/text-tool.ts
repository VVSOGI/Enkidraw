import { v4 } from "uuid";
import { MousePoint } from "../types";
import { MouseUtils, TimeUtils } from "../utils";
import { BaseTool, BaseToolProps } from "./base-tool";
import { Text } from "../components";

export class TextTool extends BaseTool {
  name: string = "text-tool";

  private createdTextarea: HTMLTextAreaElement | null = null;
  private createPoint: MousePoint | null = null;
  private firstDown: { position: MousePoint; time: Date } | null = null;
  private updateTargetComponent: Text | null = null;

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

  createWithDoubleClick = (e: MouseEvent) => {
    const position = MouseUtils.getMousePos(e, this.canvas);
    const down = {
      position,
      time: new Date(),
    };

    if (this.createdTextarea) {
      this.removeTextarea(this.createdTextarea);
    }

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

  createTextarea = (position: MousePoint, text: string = "") => {
    const textarea = document.createElement("textarea");
    textarea.name = v4();
    textarea.style.position = "absolute";
    textarea.style.top = `${position.y}px`;
    textarea.style.left = `${position.x}px`;
    textarea.style.resize = "none";
    textarea.style.outline = "none";
    textarea.style.border = "none";
    textarea.style.backgroundColor = "transparent";
    textarea.style.fontSize = "18px";
    textarea.style.setProperty("field-sizing", "content");
    textarea.textContent = text;
    textarea.focus();
    document.body.appendChild(textarea);
    this.createdTextarea = textarea;
    this.createdTextarea.focus();
  };

  removeTextarea = (created: HTMLTextAreaElement) => {
    document.body.removeChild(created);
    this.createdTextarea = null;
  };

  activateTextTool = (position: MousePoint, text: string, component: Text) => {
    this.activate();
    this.createTextarea(position, text);
    this.createPoint = position;
    this.updateTargetComponent = component;

    (window as Window).getSelection()?.selectAllChildren(this.createdTextarea as Node);
  };

  appendComponent = (mousePoint: MousePoint) => {
    if (!this.createdTextarea?.clientWidth || !this.createdTextarea?.clientHeight) return;

    const { x, y } = mousePoint;
    const position = {
      x1: x,
      y1: y,
      x2: x + this.createdTextarea.clientWidth,
      y2: y + this.createdTextarea.clientHeight,
    };

    const textComponent = new Text({
      canvas: this.canvas,
      ctx: this.ctx,
      position,
      currentText: this.createdTextarea.value,
      getZoomTransform: this.getZoomTransform,
      activateTextTool: this.activateTextTool,
    });

    this.componentManager.add(textComponent);
  };

  onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    const position = MouseUtils.getMousePos(e, this.canvas);

    if (this.createdTextarea && this.createPoint) {
      this.appendComponent(this.createPoint);
      this.removeTextarea(this.createdTextarea);
      this.deactivate();
      this.createPoint = null;

      if (this.updateTargetComponent) {
        this.componentManager.remove(this.updateTargetComponent);
      }

      return;
    }

    this.createPoint = position;
    this.createTextarea(position);
  };

  onMouseMove = (e: MouseEvent) => {};

  onMouseUp = (e: MouseEvent) => {};

  onKeyDown = (e: KeyboardEvent) => {};

  draw = () => {};

  reset = () => {};
}
