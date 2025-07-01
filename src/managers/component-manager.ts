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
  private multiResizeRange = 5;

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
        component.multiDragMode(false);
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
    } else {
      for (const component of this.selectedComponents) {
        component.activate();
        component.multiDragMode(false);
        this.multiSelectRange = null;
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

  /**
   * Handle multi-drag mode range calculation and display
   */
  private handleMultiDragMode = (mousePos: MousePoint): boolean => {
    if (this.activeManager.currentActive === "drag" && this.selectedComponents.size > 1) {
      const multiRange = this.calculateMultiSelectBounds();
      this.multiSelectRange = Object.assign({}, multiRange);
      this.originMultiSelectRange = Object.assign({}, multiRange);
      return true;
    }
    return false;
  };

  /**
   * Handle movement of selected components
   */
  private handleComponentMove = (e: MouseEvent, mousePos: MousePoint) => {
    if (!this.tempPosition) return;

    const delta = {
      x: mousePos.x - this.tempPosition.x,
      y: mousePos.y - this.tempPosition.y,
    };

    for (const component of this.selectedComponents) {
      if (this.activeManager.currentActive === "move") {
        component.moveComponent(e, delta);
      }
    }

    this.updateMultiSelectRange(delta);
  };

  /**
   * Handle hover effects for all components
   */
  private handleHoverEffects = (e: MouseEvent, mouse: MousePoint) => {
    // Handle multi-select range hover
    if (this.multiSelectRange) {
      const zone = this.getMultiSelectHoverZone(mouse);
      if (zone !== "outside") {
        const cursorStyle = this.getCursorStyleForZone(zone);
        this.activeManager.setCursorStyle(cursorStyle);
        return;
      }
    }

    // Handle individual component hover
    for (const component of this.components) {
      if (component.isHover(e)) {
        component.hoverComponent(e, mouse);
        this.activeManager.setCursorStyle("pointer");
        return;
      }
    }

    // Default cursor when not hovering anything
    this.activeManager.setCursorStyle("default");
  };

  /**
   * Calculate bounds of selected components
   */
  private calculateMultiSelectBounds = (): DragRange => {
    let top = Infinity;
    let left = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    for (const component of this.selectedComponents) {
      const { x1: minimumX, y1: minimumY, x2: maximumX, y2: maximumY } = component.getPosition();

      top = Math.min(top, minimumY);
      left = Math.min(left, minimumX);
      right = Math.max(right, maximumX);
      bottom = Math.max(bottom, maximumY);
    }

    return {
      x1: left - this.multiRangePadding,
      y1: top - this.multiRangePadding,
      x2: right + this.multiRangePadding,
      y2: bottom + this.multiRangePadding,
    };
  };

  /**
   * Update multi-select range position
   */
  private updateMultiSelectRange = (delta: { x: number; y: number }) => {
    if (this.multiSelectRange && this.originMultiSelectRange) {
      this.multiSelectRange.x1 = this.originMultiSelectRange.x1 + delta.x;
      this.multiSelectRange.y1 = this.originMultiSelectRange.y1 + delta.y;
      this.multiSelectRange.x2 = this.originMultiSelectRange.x2 + delta.x;
      this.multiSelectRange.y2 = this.originMultiSelectRange.y2 + delta.y;
    }
  };

  /**
   * Handle component resizing
   */
  private handleComponentResize = (e: MouseEvent, mousePos: MousePoint) => {};

  private onMouseMove = (e: MouseEvent) => {
    const mousePos = MouseUtils.getMousePos(e, this.canvas);

    // 1. Handle multi-drag mode
    if (this.handleMultiDragMode(mousePos)) {
      return;
    }

    // 2. Handle component resizing
    if (this.activeManager.currentActive === "resize") {
      this.handleComponentResize(e, mousePos);
      return;
    }

    // 3. Handle component movement
    this.handleComponentMove(e, mousePos);

    // 4. Handle hover effects
    this.handleHoverEffects(e, mousePos);
  };

  private onMouseDown = (e: MouseEvent) => {
    const mousePos = MouseUtils.getMousePos(e, this.canvas);

    // Handle multi-select range interactions
    if (this.multiSelectRange) {
      const zone = this.getMultiSelectHoverZone(mousePos);

      if (zone !== "outside") {
        this.tempPosition = mousePos;

        // Set appropriate mode based on zone
        if (zone === "inside") {
          this.activeManager.setMove();
        } else {
          // Handle resize modes for edges
          this.activeManager.setResize();
        }

        return;
      }
    }

    const component = this.findComponentWithPosition(e);

    if (component && this.selectedComponents.has(component)) {
      this.tempPosition = mousePos;
      this.activeManager.setMove();
      return;
    }

    if (component) {
      this.selectComponent(component);
      this.activeManager.setMove();
      this.tempPosition = mousePos;
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

  /**
   * Detect which zone of multi-select range the mouse is hovering
   */
  private getMultiSelectHoverZone = (mouse: MousePoint): "left" | "right" | "top" | "bottom" | "inside" | "outside" => {
    if (!this.multiSelectRange) return "outside";

    const { x1: left, x2: right, y1: top, y2: bottom } = this.multiSelectRange;

    // Left edge
    if (
      mouse.x >= left - this.multiResizeRange &&
      mouse.x <= left + this.multiResizeRange &&
      mouse.y >= top &&
      mouse.y <= bottom
    ) {
      return "left";
    }

    // Right edge
    if (
      mouse.x >= right - this.multiResizeRange &&
      mouse.x <= right + this.multiResizeRange &&
      mouse.y >= top &&
      mouse.y <= bottom
    ) {
      return "right";
    }

    // Top edge
    if (
      mouse.x >= left &&
      mouse.x <= right &&
      mouse.y >= top - this.multiResizeRange &&
      mouse.y <= top + this.multiResizeRange
    ) {
      return "top";
    }

    // Bottom edge
    if (
      mouse.x >= left &&
      mouse.x <= right &&
      mouse.y >= bottom - this.multiResizeRange &&
      mouse.y <= bottom + this.multiResizeRange
    ) {
      return "bottom";
    }

    // Inside
    if (mouse.x >= left && mouse.x <= right && mouse.y >= top && mouse.y <= bottom) {
      return "inside";
    }

    return "outside";
  };

  /**
   * Get cursor style based on hover zone
   */
  private getCursorStyleForZone = (zone: ReturnType<typeof this.getMultiSelectHoverZone>) => {
    switch (zone) {
      case "left":
      case "right":
        return "ew-resize";
      case "top":
      case "bottom":
        return "ns-resize";
      case "inside":
        return "move";
      default:
        return "default";
    }
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
