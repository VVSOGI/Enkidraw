import { BaseComponent, BaseComponentProps, BasePosition } from ".";
import { DragRange, EdgeDirection, MousePoint, MouseUtils, STYLE_SYSTEM, TimeUtils } from "..";

interface TextComponentProps<T> extends BaseComponentProps<T> {
  currentText: string;
  activateTextTool: (position: MousePoint, text: string, component: Text) => void;
}

export class Text extends BaseComponent {
  name: string = "text-component";
  currentText: string = "";
  isUpdate: boolean = false;

  private totalPadding = 10;
  private dragCornorRectSize = 10;
  private updateDuration = 0.5;
  private firstClickTiming: Date | null = null;
  private activateTextTool: (position: MousePoint, text: string, component: Text) => void;

  constructor({
    canvas,
    ctx,
    position,
    currentText,
    getZoomTransform,
    activateTextTool,
  }: TextComponentProps<BasePosition>) {
    super({ canvas, ctx, position, getZoomTransform });
    this.currentText = currentText;
    this.isTransformSelect = true;
    this.activateTextTool = activateTextTool;
  }

  initialPosition = () => {
    this.originPosition = {
      x1: this.position.x1,
      y1: this.position.y1,
      x2: this.position.x2,
      y2: this.position.y2,
    };
  };

  getPosition = () => {
    const x1 = Math.min(this.position.x1 - this.totalPadding, this.position.x2 + this.totalPadding);
    const x2 = Math.max(this.position.x1 - this.totalPadding, this.position.x2 + this.totalPadding);
    const y1 = Math.min(this.position.y1 - this.totalPadding, this.position.y2 + this.totalPadding);
    const y2 = Math.max(this.position.y1 - this.totalPadding, this.position.y2 + this.totalPadding);

    return { x1, y1, x2, y2 };
  };

  isHover = (e: MouseEvent) => {
    const { x1, y1, x2, y2 } = this.position;
    const transform = this.getZoomTransform();
    const { x: mouseX, y: mouseY } = MouseUtils.getLogicalMousePos(e, this.canvas, transform);

    if (
      mouseX >= x1 - this.totalPadding - this.dragCornorRectSize / 2 &&
      mouseX <= x2 + this.totalPadding + this.dragCornorRectSize / 2 &&
      mouseY >= y1 - this.totalPadding - this.dragCornorRectSize / 2 &&
      mouseY <= y2 + this.totalPadding + this.dragCornorRectSize / 2
    ) {
      return true;
    }

    return false;
  };

  isClicked = (e: MouseEvent) => {
    const { x1, y1, x2, y2 } = this.position;
    const transform = this.getZoomTransform();
    const { x: mouseX, y: mouseY } = MouseUtils.getLogicalMousePos(e, this.canvas, transform);
    if (
      mouseX >= x1 - this.totalPadding - this.dragCornorRectSize / 2 &&
      mouseX <= x2 + this.totalPadding + this.dragCornorRectSize / 2 &&
      mouseY >= y1 - this.totalPadding - this.dragCornorRectSize / 2 &&
      mouseY <= y2 + this.totalPadding + this.dragCornorRectSize / 2
    ) {
      if (this.firstClickTiming) {
        const timing = new Date();

        if (
          TimeUtils.isWithingTimeLimit(this.firstClickTiming, timing, this.updateDuration) &&
          mouseX >= x1 &&
          mouseX <= x2 &&
          mouseY >= y1 &&
          mouseY <= y2
        ) {
          this.activateTextTool({ x: this.position.x1, y: this.position.y1 }, this.currentText, this);
          this.isUpdate = true;
          this.deactivate();
        }

        this.firstClickTiming = null;
      } else {
        this.firstClickTiming = new Date();
      }

      return true;
    }

    return false;
  };

  hoverComponent = (e: MouseEvent, move: MousePoint) => {};

  moveComponent = (e: MouseEvent, move: MousePoint) => {
    const { x: moveX, y: moveY } = move;
    const nextPosition = Object.assign({}, this.position);
    nextPosition.x1 = this.originPosition.x1 + moveX;
    nextPosition.y1 = this.originPosition.y1 + moveY;
    nextPosition.x2 = this.originPosition.x2 + moveX;
    nextPosition.y2 = this.originPosition.y2 + moveY;

    this.position = nextPosition;
  };

  resizeComponent = (mouseDistance: MousePoint, multiSelectRange: DragRange, edgeDirection: EdgeDirection) => {
    if (edgeDirection === "right") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX + mouseDistance.x;
      const scale = newTotalRangeX / totalRangeX;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x1 + relativeX1 * scale, multiSelectRange.x1 + relativeX2 * scale),
        x2: Math.max(multiSelectRange.x1 + relativeX1 * scale, multiSelectRange.x1 + relativeX2 * scale),
      };
    }

    if (edgeDirection === "left") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX - mouseDistance.x;
      const scale = newTotalRangeX / totalRangeX;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x2 + relativeX1 * scale, multiSelectRange.x2 + relativeX2 * scale),
        x2: Math.max(multiSelectRange.x2 + relativeX1 * scale, multiSelectRange.x2 + relativeX2 * scale),
      };
    }

    if (edgeDirection === "top") {
      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY - mouseDistance.y;
      const scale = newTotalRangeY / totalRangeY;

      const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

      // Adjust all points with the same scale
      this.position = {
        ...this.position,
        y1: Math.min(multiSelectRange.y2 + relativeY1 * scale, multiSelectRange.y2 + relativeY2 * scale),
        y2: Math.max(multiSelectRange.y2 + relativeY1 * scale, multiSelectRange.y2 + relativeY2 * scale),
      };
    }

    if (edgeDirection === "bottom") {
      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY + mouseDistance.y;
      const scale = newTotalRangeY / totalRangeY;

      const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

      this.position = {
        ...this.position,
        y1: Math.min(multiSelectRange.y1 + relativeY1 * scale, multiSelectRange.y1 + relativeY2 * scale),
        y2: Math.max(multiSelectRange.y1 + relativeY1 * scale, multiSelectRange.y1 + relativeY2 * scale),
      };
    }

    if (edgeDirection === "top-left") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX - mouseDistance.x;
      const scaleX = newTotalRangeX / totalRangeX;

      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY - mouseDistance.y;
      const scaleY = newTotalRangeY / totalRangeY;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x2 + relativeX1 * scaleX, multiSelectRange.x2 + relativeX2 * scaleX),
        y1: Math.min(multiSelectRange.y2 + relativeY1 * scaleY, multiSelectRange.y2 + relativeY2 * scaleY),
        x2: Math.max(multiSelectRange.x2 + relativeX1 * scaleX, multiSelectRange.x2 + relativeX2 * scaleX),
        y2: Math.max(multiSelectRange.y2 + relativeY1 * scaleY, multiSelectRange.y2 + relativeY2 * scaleY),
      };
    }

    if (edgeDirection === "top-right") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX + mouseDistance.x;
      const scaleX = newTotalRangeX / totalRangeX;

      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY - mouseDistance.y;
      const scaleY = newTotalRangeY / totalRangeY;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y2;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y2;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x1 + relativeX1 * scaleX, multiSelectRange.x1 + relativeX2 * scaleX),
        y1: Math.min(multiSelectRange.y2 + relativeY1 * scaleY, multiSelectRange.y2 + relativeY2 * scaleY),
        x2: Math.max(multiSelectRange.x1 + relativeX1 * scaleX, multiSelectRange.x1 + relativeX2 * scaleX),
        y2: Math.max(multiSelectRange.y2 + relativeY1 * scaleY, multiSelectRange.y2 + relativeY2 * scaleY),
      };
    }

    if (edgeDirection === "bottom-left") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX - mouseDistance.x;
      const scaleX = newTotalRangeX / totalRangeX;

      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY + mouseDistance.y;
      const scaleY = newTotalRangeY / totalRangeY;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x2;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x2;
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x2 + relativeX1 * scaleX, multiSelectRange.x2 + relativeX2 * scaleX),
        y1: Math.min(multiSelectRange.y1 + relativeY1 * scaleY, multiSelectRange.y1 + relativeY2 * scaleY),
        x2: Math.max(multiSelectRange.x2 + relativeX1 * scaleX, multiSelectRange.x2 + relativeX2 * scaleX),
        y2: Math.max(multiSelectRange.y1 + relativeY1 * scaleY, multiSelectRange.y1 + relativeY2 * scaleY),
      };
    }

    if (edgeDirection === "bottom-right") {
      const totalRangeX = Math.abs(multiSelectRange.x2 - multiSelectRange.x1);
      const newTotalRangeX = totalRangeX + mouseDistance.x;
      const scaleX = newTotalRangeX / totalRangeX;

      const totalRangeY = Math.abs(multiSelectRange.y2 - multiSelectRange.y1);
      const newTotalRangeY = totalRangeY + mouseDistance.y;
      const scaleY = newTotalRangeY / totalRangeY;

      const relativeX1 = this.originPosition.x1 - multiSelectRange.x1;
      const relativeX2 = this.originPosition.x2 - multiSelectRange.x1;
      const relativeY1 = this.originPosition.y1 - multiSelectRange.y1;
      const relativeY2 = this.originPosition.y2 - multiSelectRange.y1;

      this.position = {
        ...this.position,
        x1: Math.min(multiSelectRange.x1 + relativeX1 * scaleX, multiSelectRange.x1 + relativeX2 * scaleX),
        y1: Math.min(multiSelectRange.y1 + relativeY1 * scaleY, multiSelectRange.y1 + relativeY2 * scaleY),
        x2: Math.max(multiSelectRange.x1 + relativeX1 * scaleX, multiSelectRange.x1 + relativeX2 * scaleX),
        y2: Math.max(multiSelectRange.y1 + relativeY1 * scaleY, multiSelectRange.y1 + relativeY2 * scaleY),
      };
    }
  };

  getMultiSelectHoverZone = (mouse: MousePoint): EdgeDirection | "inside" | "outside" => {
    const { x1: left, x2: right, y1: top, y2: bottom } = this.position;

    // Top-left corner
    if (
      mouse.x >= left - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.x <= left - this.multiDragPadding &&
      mouse.y >= top - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.y <= top - this.multiDragPadding
    ) {
      return "top-left";
    }

    // Top-right corner
    if (
      mouse.x >= right + this.multiDragPadding &&
      mouse.x <= right + this.multiDragPadding + this.dragCornorRectSize &&
      mouse.y >= top - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.y <= top - this.multiDragPadding
    ) {
      return "top-right";
    }

    // Bottom-left corner
    if (
      mouse.x >= left - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.x <= left - this.multiDragPadding &&
      mouse.y >= bottom + this.multiDragPadding &&
      mouse.y <= bottom + this.multiDragPadding + this.dragCornorRectSize
    ) {
      return "bottom-left";
    }

    // Bottom-right corner
    if (
      mouse.x >= right + this.multiDragPadding &&
      mouse.x <= right + this.multiDragPadding + this.dragCornorRectSize &&
      mouse.y >= bottom + this.multiDragPadding &&
      mouse.y <= bottom + this.multiDragPadding + this.dragCornorRectSize
    ) {
      return "bottom-right";
    }

    // Left edge
    if (
      mouse.x >= left - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.x <= left - this.multiDragPadding &&
      mouse.y > top - this.multiDragPadding &&
      mouse.y < bottom + this.multiDragPadding
    ) {
      return "left";
    }

    // Right edge
    if (
      mouse.x >= right + this.multiDragPadding &&
      mouse.x <= right + this.multiDragPadding + this.dragCornorRectSize &&
      mouse.y > top - this.multiDragPadding &&
      mouse.y < bottom + this.multiDragPadding
    ) {
      return "right";
    }

    // Top edge
    if (
      mouse.x > left - this.multiDragPadding &&
      mouse.x < right + this.multiDragPadding &&
      mouse.y >= top - (this.multiDragPadding + this.dragCornorRectSize) &&
      mouse.y <= top - this.multiDragPadding
    ) {
      return "top";
    }

    // Bottom edge
    if (
      mouse.x > left - this.multiDragPadding &&
      mouse.x < right + this.multiDragPadding &&
      mouse.y >= bottom + this.multiDragPadding &&
      mouse.y <= bottom + this.multiDragPadding + this.dragCornorRectSize
    ) {
      return "bottom";
    }

    // Inside
    if (
      mouse.x >= left - this.multiDragPadding &&
      mouse.x <= right + this.multiDragPadding &&
      mouse.y >= top - this.multiDragPadding &&
      mouse.y <= bottom + this.multiDragPadding
    ) {
      return "inside";
    }

    return "outside";
  };

  drawMultilineText() {
    const maxWidth = this.position.x2 - this.position.x1 + 1;
    const lines = this.currentText.split("\n");
    const lineHeight = 21.5;
    let y = this.position.y1;

    const drawLine = (text: string) => {
      this.ctx.fillText(text, this.position.x1, y + 17, maxWidth);
      y += lineHeight;
    };

    lines.forEach((line) => {
      if (line.trim() === "") {
        y += lineHeight;
        return;
      }

      let currentLine = "";
      const words = line.split(" ");

      for (const word of words) {
        if (this.ctx.measureText(word).width > maxWidth) {
          if (currentLine !== "") {
            drawLine(currentLine);
            currentLine = "";
          }

          let tempWord = "";
          for (const char of word) {
            if (this.ctx.measureText(tempWord + char).width > maxWidth) {
              drawLine(tempWord);
              tempWord = char;
            } else {
              tempWord += char;
            }
          }
          currentLine = tempWord;
          continue;
        }

        const testLine = currentLine === "" ? word : currentLine + " " + word;
        if (this.ctx.measureText(testLine).width > maxWidth) {
          drawLine(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine !== "") {
        drawLine(currentLine);
      }
    });

    this.position.x2 = Math.min(this.position.x1 + maxWidth, this.position.x2);
    this.position.y2 = y;
  }

  multiDragEffect = () => {
    this.ctx.save();
    this.ctx.beginPath();

    const width = this.position.x2 - this.position.x1 + this.totalPadding * 2;
    const height = this.position.y2 - this.position.y1 + this.totalPadding * 2;

    this.ctx.strokeStyle = STYLE_SYSTEM.PRIMARY;
    this.ctx.rect(this.position.x1 - this.totalPadding, this.position.y1 - this.totalPadding, width, height);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  dragEffect = () => {
    this.ctx.save();
    this.ctx.beginPath();

    const width = this.position.x2 - this.position.x1 + this.totalPadding * 2;
    const height = this.position.y2 - this.position.y1 + this.totalPadding * 2;

    this.ctx.strokeStyle = STYLE_SYSTEM.PRIMARY;
    this.ctx.rect(this.position.x1 - this.totalPadding, this.position.y1 - this.totalPadding, width, height);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(
      this.position.x1 + this.dragCornorRectSize / 2 - this.totalPadding,
      this.position.y1 + this.dragCornorRectSize / 2 - this.totalPadding,
      -this.dragCornorRectSize,
      -this.dragCornorRectSize,
      4
    );
    this.ctx.roundRect(
      this.position.x2 + this.dragCornorRectSize / 2 + this.totalPadding,
      this.position.y1 + this.dragCornorRectSize / 2 - this.totalPadding,
      -this.dragCornorRectSize,
      -this.dragCornorRectSize,
      4
    );
    this.ctx.roundRect(
      this.position.x1 + this.dragCornorRectSize / 2 - this.totalPadding,
      this.position.y2 + this.dragCornorRectSize / 2 + this.totalPadding,
      -this.dragCornorRectSize,
      -this.dragCornorRectSize,
      4
    );
    this.ctx.roundRect(
      this.position.x2 + this.dragCornorRectSize / 2 + this.totalPadding,
      this.position.y2 + this.dragCornorRectSize / 2 + this.totalPadding,
      -this.dragCornorRectSize,
      -this.dragCornorRectSize,
      4
    );
    this.ctx.fillStyle = STYLE_SYSTEM.WHITE;
    this.ctx.fill();
    this.ctx.strokeStyle = STYLE_SYSTEM.PRIMARY;
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  draw = () => {
    if (!this.isUpdate) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.font = "18px monospace";
      this.ctx.fillStyle = "black";
      this.drawMultilineText();
      this.ctx.closePath();
      this.ctx.restore();
    }

    if (this.isMultiDrag) {
      this.multiDragEffect();
    }

    if (this.isActive) {
      this.dragEffect();
    }
  };
}
