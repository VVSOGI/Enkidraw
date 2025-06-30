import { BaseComponent } from "../components";
import { DragRange } from "../types";

export class ComponentManager {
  public components: Set<BaseComponent>;
  public selectedComponents: Set<BaseComponent>;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.components = new Set();
    this.selectedComponents = new Set();
    this.addEventListeners();
  }

  public draw = () => {
    for (const component of this.components) {
      component.draw();
    }
  };

  public push = (component: BaseComponent) => {
    this.components.add(component);
  };

  public getComponents = () => {
    return this.components;
  };

  public getSelectedComponents = () => {
    return this.selectedComponents;
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

  public selectComponent = (component: BaseComponent) => {
    this.initializeSelectedComponents();
    this.selectedComponents.add(component);
    component.activate();
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

  private onMouseMove = (e: MouseEvent) => {};

  private onMouseDown = (e: MouseEvent) => {};

  private onMouseUp = (e: MouseEvent) => {};

  private initializeSelectedComponents = () => {
    for (const component of this.selectedComponents) {
      component.deactivate();
    }
    this.selectedComponents = new Set();
  };
}
