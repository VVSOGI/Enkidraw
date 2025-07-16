import { ActiveManager, ComponentInteractionManager, SelectedComponentManager } from ".";
import { BaseComponent } from "../components";
import { DragRange } from "../types";
import { STYLE_SYSTEM } from "../utils";

export class ComponentManager {
  public components: Set<BaseComponent>;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected activeManager: ActiveManager;
  protected selectedComponentManager: SelectedComponentManager;
  protected componentInteractionManager: ComponentInteractionManager;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, activeManager: ActiveManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.activeManager = activeManager;
    this.components = new Set();

    this.selectedComponentManager = new SelectedComponentManager();
    this.componentInteractionManager = new ComponentInteractionManager(
      this.canvas,
      this.activeManager,
      this.selectedComponentManager,
      this.components,
      this.removeSelected
    );
  }

  public draw = () => {
    for (const component of this.components) {
      component.draw();
    }

    const multiSelectRange = this.selectedComponentManager.getMultiSelectRange();
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
    const selectedComponents = this.selectedComponentManager.getSelectedComponents();
    for (const component of selectedComponents) {
      this.components.delete(component);
    }
    this.selectedComponentManager.clearSelection();
  };

  public getComponents = () => {
    return this.components;
  };

  public dragComponents = (dragRange: DragRange) => {
    this.selectedComponentManager.dragComponents(this.components, dragRange);
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
    this.ctx.strokeStyle = STYLE_SYSTEM.primary;
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

    this.ctx.fillStyle = STYLE_SYSTEM.white;
    this.ctx.fill();
    this.ctx.strokeStyle = STYLE_SYSTEM.primary;
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };
}
