import { ComponentInteractionManager, LeftMenuManager, SelectedComponentManager } from ".";
import { BaseComponent, BasePosition } from "../components";
import { DragRange } from "../types";
import { STYLE_SYSTEM } from "../utils";
import { ActiveManager } from "./active-manager";
import { MemoryManager } from "./memory-manager";

export class ComponentManager {
  public components: BaseComponent<BasePosition>[];
  public selectedComponentManager: SelectedComponentManager;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected componentInteractionManager: ComponentInteractionManager;
  protected leftMenuManager: LeftMenuManager;
  protected activeManager: ActiveManager;
  protected memoryManager: MemoryManager;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    leftMenuManager: LeftMenuManager,
    activeManager: ActiveManager,
    memoryManager: MemoryManager,
    getZoomTransform: () => { zoom: number; translateX: number; translateY: number }
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.components = [];
    this.leftMenuManager = leftMenuManager;
    this.activeManager = activeManager;
    this.memoryManager = memoryManager;

    this.selectedComponentManager = new SelectedComponentManager();
    this.selectedComponentManager.on("lineMenuActivate", () => {
      this.leftMenuManager.setComponents(this.selectedComponentManager.selectedComponents);
      this.leftMenuManager.activate();
    });

    this.selectedComponentManager.on("lineMenuDeactivate", () => {
      this.leftMenuManager.deactivate();
    });

    this.componentInteractionManager = new ComponentInteractionManager({
      canvas: this.canvas,
      activeManager: this.activeManager,
      selectionManager: this.selectedComponentManager,
      memoryManager: this.memoryManager,
      getComponents: () => this.components,
      removeSelectedComponents: this.removeSelected,
      getZoomTransform: getZoomTransform,
    });
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
    this.memoryManager.addRedoStack(component, "add");
  };

  public remove = (component: BaseComponent) => {
    this.components = this.components.filter((exist) => exist.id !== component.id);
    this.memoryManager.addRedoStack(component, "delete");
  };

  public removeSelected = (selectedComponents: BaseComponent[]) => {
    const exceptComponents: BaseComponent[] = [];

    this.components = this.components.filter((exist) => {
      for (const component of selectedComponents) {
        if (exist.id === component.id) {
          exceptComponents.push(exist);
          return false;
        }
      }

      return true;
    });

    this.memoryManager.addRedoStack(exceptComponents, "delete");
    this.selectedComponentManager.clearSelection();
  };

  public getComponents = () => {
    return this.components;
  };

  public dragComponents = (dragRange: DragRange) => {
    this.selectedComponentManager.dragComponents(this.components, dragRange);
  };

  public findComponent = (id: string) => {
    return this.components.find((component) => component.id === id);
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
