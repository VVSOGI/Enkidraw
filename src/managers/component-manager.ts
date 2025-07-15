import { BaseComponent } from "../components";
import { DragRange } from "../types";
import { ActiveManager } from "./active-manager";
import { SelectionManager } from "./selection-manager";
import { ComponentInteractionManager } from "./component-interaction-manager";

export class ComponentManager {
  public components: Set<BaseComponent>;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected activeManager: ActiveManager;
  protected selectionManager: SelectionManager;
  protected componentInteractionManager: ComponentInteractionManager;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, activeManager: ActiveManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.activeManager = activeManager;
    this.components = new Set();

    this.selectionManager = new SelectionManager();
    this.componentInteractionManager = new ComponentInteractionManager(
      canvas,
      activeManager,
      this.selectionManager,
      this.components,
      this.removeSelected
    );
  }

  public draw = () => {
    for (const component of this.components) {
      component.draw();
    }

    const multiSelectRange = this.selectionManager.getMultiSelectRange();
    if (multiSelectRange) {
      this.multiDragRangeEffect(multiSelectRange);
      this.multiDragRangeCornerEffect(multiSelectRange);
    }
  };

  public add = (component: BaseComponent) => {
    this.components.add(component);
  };

  public remove = (component: BaseComponent) => {
    this.components.delete(component);
  };

  public removeSelected = () => {
    const selectedComponents = this.selectionManager.getSelectedComponents();
    for (const component of selectedComponents) {
      this.components.delete(component);
    }
    this.selectionManager.clearSelection();
  };

  public getComponents = () => {
    return this.components;
  };

  public dragComponents = (dragRange: DragRange) => {
    this.selectionManager.dragComponents(this.components, dragRange);
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
    const multiRangeCornerRectSize = 10;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(
      x1 - multiRangeCornerRectSize / 2,
      y1 - multiRangeCornerRectSize / 2,
      multiRangeCornerRectSize,
      multiRangeCornerRectSize,
      2
    );

    this.ctx.roundRect(
      x2 - multiRangeCornerRectSize / 2,
      y1 - multiRangeCornerRectSize / 2,
      multiRangeCornerRectSize,
      multiRangeCornerRectSize,
      2
    );

    this.ctx.roundRect(
      x2 - multiRangeCornerRectSize / 2,
      y2 - multiRangeCornerRectSize / 2,
      multiRangeCornerRectSize,
      multiRangeCornerRectSize,
      2
    );

    this.ctx.roundRect(
      x1 - multiRangeCornerRectSize / 2,
      y2 - multiRangeCornerRectSize / 2,
      multiRangeCornerRectSize,
      multiRangeCornerRectSize,
      2
    );

    this.ctx.fillStyle = "#ffffff";
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(105, 105, 230, 0.5)";
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };

  public destroy = () => {
    this.componentInteractionManager.removeEventListeners();
  };
}
