import { BaseComponent } from "../components";
import { DragRange, MousePoint } from "../types";
import { MouseUtils } from "../utils";
import { ActiveManager } from "./active-manager";

/**
 * Component Click Handling Logic (onMouseDown, onMouseMove, onMouseUp)
 *
 * 1. Clicking an Active Component (selectedComponents.has(component) === true)
 *    - onMouseDown:
 *      • Detect clicked component via findComponentWithPosition(e)
 *      • Verify component is already in selectedComponents
 *      • Store starting point: tempPosition = MouseUtils.getMousePos(e, canvas)
 *      • Activate move mode: activeManager.setMove()
 *    - onMouseMove:
 *      • Calculate difference between tempPosition and current mouse position
 *      • Update position in real-time: component.moveComponent(next)
 *    - onMouseUp:
 *      • Reset: tempPosition = null
 *      • Update originPosition: component.initialPosition()
 *
 * 2. Clicking an Inactive Component (component not in selectedComponents)
 *    - onMouseDown:
 *      • Detect clicked component via findComponentWithPosition(e)
 *      • Call selectComponent(component):
 *        - Clear existing selections: initializeSelectedComponents()
 *        - Add new component: selectedComponents.add(component)
 *        - Activate component: component.activate()
 *      • Store tempPosition and call activeManager.setMove()
 *    - Subsequent behavior same as scenario 1
 *
 * 3. Clicking Empty Space (findComponentWithPosition(e) === null)
 *    - onMouseDown:
 *      • Call initializeSelectedComponents():
 *        - Deactivate all selectedComponents: component.deactivate()
 *        - Reset selection: selectedComponents = new Set()
 *        - Restore default mode: activeManager.setDefault()
 *
 * 4. Clicking One of Multiple Selected Components
 *    - onMouseMove: All components in selectedComponents execute moveComponent() with same next value
 *    - All selected components move simultaneously by the same distance
 *
 * Key State Variables:
 * - selectedComponents: Set of currently selected components
 * - tempPosition: Mouse position at drag start point
 * - activeManager.currentActive: Current active mode ("move" | "default" | ...)
 */
export class ComponentManager {
  public components: Set<BaseComponent>;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected activeManager: ActiveManager;

  private selectedComponents: Set<BaseComponent>;
  private tempPosition: MousePoint | null = null;

  private originMultiSelectRange: DragRange | null = null;
  private multiSelectRange: DragRange | null = null;
  private multiRangePadding = 10;
  private multiRangeCornerRectSize = 10;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, activeManager: ActiveManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.activeManager = activeManager;
    this.components = new Set();
    this.selectedComponents = new Set();
    this.addEventListeners();
  }

  public draw = () => {
    for (const component of this.components) {
      component.draw();
    }

    if (!this.multiSelectRange) return;

    this.multiDragRangeEffect(this.multiSelectRange);
    this.multiDragRangeCornerEffect(this.multiSelectRange);
  };

  public add = (component: BaseComponent) => {
    this.components.add(component);
  };

  public getComponents = () => {
    return this.components;
  };

  public dragComponents = (dragRange: DragRange) => {
    const { x1: dragX1, y1: dragY1, x2: dragX2, y2: dragY2 } = dragRange;

    for (const component of this.components) {
      const { x1: componentX1, y1: componentY1, x2: componentX2, y2: componentY2 } = component.getPosition();
      if (componentX1 >= dragX1 && componentX2 <= dragX2 && componentY1 >= dragY1 && componentY2 <= dragY2) {
        component.activate();
        this.selectedComponents.add(component);
      } else {
        component.deactivate();
        this.selectedComponents.delete(component);
      }
    }

    /**
     * All Selected Components deactivated When selected component more than 1
     */
    if (this.selectedComponents.size > 1) {
      for (const component of this.selectedComponents) {
        component.deactivate();
        component.multiDragMode(true);
      }
    }
  };

  private selectComponent = (component: BaseComponent) => {
    this.initializeSelectedComponents();
    this.selectedComponents.add(component);
    component.activate();
  };

  private findComponentWithPosition = (e: MouseEvent) => {
    for (const component of this.components) {
      if (component.isClicked(e)) {
        return component;
      }
    }

    return null;
  };

  private onMouseMove = (e: MouseEvent) => {
    const { x: moveX, y: moveY } = MouseUtils.getMousePos(e, this.canvas);

    if (this.activeManager.currentActive === "drag" && this.selectedComponents.size > 1) {
      /**
       * Find min [top, left] max [bottom, right] in components
       */
      let top = Infinity;
      let left = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;

      for (const component of this.components) {
        const { x1: minimumX, y1: minimumY, x2: maximumX, y2: maximumY } = component.getPosition();

        top = Math.min(top, minimumY);
        left = Math.min(left, minimumX);
        right = Math.max(right, maximumX);
        bottom = Math.max(bottom, maximumY);
      }

      const multiRange = {
        x1: left - this.multiRangePadding,
        y1: top - this.multiRangePadding,
        x2: right + this.multiRangePadding,
        y2: bottom + this.multiRangePadding,
      };

      this.multiSelectRange = Object.assign({}, multiRange);
      this.originMultiSelectRange = Object.assign({}, multiRange);

      return;
    }

    if (!this.tempPosition) return;
    const { x: startX, y: startY } = this.tempPosition;

    for (const component of this.components) {
      if (this.selectedComponents.has(component) && this.activeManager.currentActive === "move") {
        const next = {
          x: moveX - startX,
          y: moveY - startY,
        };
        component.moveComponent(e, next);

        if (this.multiSelectRange && this.originMultiSelectRange) {
          this.multiSelectRange.x1 = this.originMultiSelectRange.x1 + next.x;
          this.multiSelectRange.y1 = this.originMultiSelectRange.y1 + next.y;
          this.multiSelectRange.x2 = this.originMultiSelectRange.x2 + next.x;
          this.multiSelectRange.y2 = this.originMultiSelectRange.y2 + next.y;
        }
      }

      component.hoverComponent(e, { x: moveX, y: moveY });
    }
  };

  private onMouseDown = (e: MouseEvent) => {
    /** If clicked multi drag range */
    if (this.multiSelectRange) {
      const { x: clickX, y: clickY } = MouseUtils.getMousePos(e, this.canvas);
      if (
        clickX >= this.multiSelectRange.x1 &&
        clickX <= this.multiSelectRange.x2 &&
        clickY >= this.multiSelectRange.y1 &&
        clickY <= this.multiSelectRange.y2
      ) {
        this.tempPosition = { x: clickX, y: clickY };
        this.activeManager.setMove();
        this.activeManager.setCursorStyle("move");
        return;
      }
    }

    const component = this.findComponentWithPosition(e);

    if (component && this.selectedComponents.has(component)) {
      this.tempPosition = MouseUtils.getMousePos(e, this.canvas);
      this.activeManager.setMove();
      this.activeManager.setCursorStyle("move");
      return;
    }

    if (component) {
      this.selectComponent(component);
      this.activeManager.setMove();
      this.activeManager.setCursorStyle("move");
      this.tempPosition = MouseUtils.getMousePos(e, this.canvas);
    } else {
      this.initializeSelectedComponents();
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    this.tempPosition = null;
    this.originMultiSelectRange = Object.assign({}, this.multiSelectRange);

    for (const component of this.components) {
      component.initialPosition();
    }
  };

  private initializeSelectedComponents = () => {
    for (const component of this.selectedComponents) {
      component.deactivate();
      component.multiDragMode(false);
    }
    this.multiSelectRange = null;
    this.originMultiSelectRange = null;
    this.selectedComponents = new Set();
    this.activeManager.setDefault();
  };

  private multiDragRangeEffect = (range: DragRange) => {
    const { x1, y1, x2, y2 } = range;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.setLineDash([1, 1]);
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x1, y2);
    this.ctx.lineTo(x1, y1);
    this.ctx.strokeStyle = "rgba(105, 105, 230, 0.5)";
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  private multiDragRangeCornerEffect = (range: DragRange) => {
    const { x1, y1, x2, y2 } = range;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(
      x1 - this.multiRangeCornerRectSize / 2,
      y1 - this.multiRangeCornerRectSize / 2,
      this.multiRangeCornerRectSize,
      this.multiRangeCornerRectSize,
      2
    );

    this.ctx.roundRect(
      x2 - this.multiRangeCornerRectSize / 2,
      y1 - this.multiRangeCornerRectSize / 2,
      this.multiRangeCornerRectSize,
      this.multiRangeCornerRectSize,
      2
    );

    this.ctx.roundRect(
      x2 - this.multiRangeCornerRectSize / 2,
      y2 - this.multiRangeCornerRectSize / 2,
      this.multiRangeCornerRectSize,
      this.multiRangeCornerRectSize,
      2
    );

    this.ctx.roundRect(
      x1 - this.multiRangeCornerRectSize / 2,
      y2 - this.multiRangeCornerRectSize / 2,
      this.multiRangeCornerRectSize,
      this.multiRangeCornerRectSize,
      2
    );

    this.ctx.fillStyle = "#ffffff";
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(105, 105, 230, 0.5)";
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  private addEventListeners = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
  };

  private removeEventListeners = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
  };
}
