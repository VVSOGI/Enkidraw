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
    for (const component of this.components) {
      if (this.selectedComponents.has(component) && component.isActive && this.activeManager.currentActive === "move") {
        if (!this.tempPosition) return;
        const { x: startX, y: startY } = this.tempPosition;
        const next = {
          x: moveX - startX,
          y: moveY - startY,
        };
        component.moveComponent(next);
      }

      const isOverMouse = component.isHover(e);
      if (isOverMouse) {
        component.hoverComponent({ x: moveX, y: moveY });
      } else {
        component.initialPosition();
      }
    }
  };

  private onMouseDown = (e: MouseEvent) => {
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

    for (const component of this.components) {
      component.initialPosition();
    }
  };

  private initializeSelectedComponents = () => {
    for (const component of this.selectedComponents) {
      component.deactivate();
    }
    this.selectedComponents = new Set();
    this.activeManager.setDefault();
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
