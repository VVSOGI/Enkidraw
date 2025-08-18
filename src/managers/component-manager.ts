import { ComponentInteractionManager, LeftMenuManager, SelectedComponentManager } from ".";
import { BaseComponent, BasePosition } from "../components";
import { Active, DragRange } from "../types";
import { STYLE_SYSTEM } from "../utils";
import { ActiveManager } from "./active-manager";

export class ComponentManager {
  public components: BaseComponent<BasePosition>[];

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected selectedComponentManager: SelectedComponentManager;
  protected componentInteractionManager: ComponentInteractionManager;
  protected leftMenuManager: LeftMenuManager;
  protected activeManager: ActiveManager;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    leftMenuManager: LeftMenuManager,
    activeManager: ActiveManager,
    getZoomTransform: () => { zoom: number; translateX: number; translateY: number }
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.components = [];
    this.leftMenuManager = leftMenuManager;
    this.activeManager = activeManager;

    this.selectedComponentManager = new SelectedComponentManager();
    this.selectedComponentManager.on("menuActivate", () => {
      this.leftMenuManager.setComponents(this.selectedComponentManager.selectedComponents);
      this.leftMenuManager.activate();
    });

    this.selectedComponentManager.on("menuDeactivate", () => {
      this.leftMenuManager.deactivate();
    });

    this.componentInteractionManager = new ComponentInteractionManager(
      this.canvas,
      this.activeManager,
      this.selectedComponentManager,
      this.components,
      this.removeSelected,
      getZoomTransform
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
    this.components.push(component);
  };

  public remove = (component: BaseComponent) => {
    this.components = this.components.filter((exist) => exist.id !== component.id);
  };

  public removeSelected = () => {
    const selectedComponents = this.selectedComponentManager.getSelectedComponents();
    this.components = this.components.filter((exist) => {
      for (const component of selectedComponents) {
        if (exist.id === component.id) return false;
      }

      return true;
    });

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
    this.ctx.strokeStyle = STYLE_SYSTEM.PRIMARY;
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

    this.ctx.fillStyle = STYLE_SYSTEM.WHITE;
    this.ctx.fill();
    this.ctx.strokeStyle = STYLE_SYSTEM.PRIMARY;
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  };
}
