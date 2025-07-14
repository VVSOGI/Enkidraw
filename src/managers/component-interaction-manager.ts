import { BaseComponent } from "../components";
import { DragRange, EdgeDirection, MousePoint } from "../types";
import { MouseUtils } from "../utils";
import { ActiveManager } from "./active-manager";
import { SelectionManager } from "./selection-manager";

export class ComponentInteractionManager {
  private canvas: HTMLCanvasElement;
  private activeManager: ActiveManager;
  private selectionManager: SelectionManager;
  private components: Set<BaseComponent>;

  private tempPosition: MousePoint | null = null;
  private resizeEdge: EdgeDirection | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    activeManager: ActiveManager,
    selectionManager: SelectionManager,
    components: Set<BaseComponent>
  ) {
    this.canvas = canvas;
    this.activeManager = activeManager;
    this.selectionManager = selectionManager;
    this.components = components;
    this.addEventListeners();
  }

  public onMouseMove = (e: MouseEvent) => {
    const mousePos = MouseUtils.getMousePos(e, this.canvas);

    // 1. Handle multi-drag mode
    if (this.activeManager.currentActive === "drag") {
      this.handleMultiDragMode();
      return;
    }

    // 2. Handle component resizing
    if (this.activeManager.currentActive === "resize") {
      this.handleComponentResize(mousePos);
      return;
    }

    // 3. Handle component movement
    this.handleComponentMove(e, mousePos);

    // 4. Handle hover effects
    this.handleHoverEffects(e, mousePos);
  };

  public onMouseDown = (e: MouseEvent) => {
    const mousePos = MouseUtils.getMousePos(e, this.canvas);

    // Handle multi-select range interactions
    const multiSelectRange = this.selectionManager.getMultiSelectRange();
    if (multiSelectRange) {
      const zone = this.selectionManager.getMultiSelectHoverZone(mousePos);

      if (zone !== "outside") {
        this.tempPosition = mousePos;

        // Set appropriate mode based on zone
        if (zone === "inside") {
          this.activeManager.setMove();
        } else {
          // Handle resize modes for edges
          this.resizeEdge = zone;
          this.activeManager.setResize();
        }

        return;
      }
    }

    const component = this.findComponentWithPosition(e);
    const selectedComponents = this.selectionManager.getSelectedComponents();

    if (component && selectedComponents.has(component)) {
      this.tempPosition = mousePos;
      this.activeManager.setMove();
      return;
    }

    if (component) {
      this.selectionManager.selectComponent(component);
      this.activeManager.setMove();
      this.tempPosition = mousePos;
    } else {
      this.selectionManager.clearSelection();
      this.activeManager.setDefault();
    }
  };

  public onMouseUp = (e: MouseEvent) => {
    this.tempPosition = null;
    this.selectionManager.resetOriginMultiSelectRange();

    for (const component of this.components) {
      component.initialPosition();
    }
  };

  private handleMultiDragMode(): boolean {
    const selectedComponents = this.selectionManager.getSelectedComponents();
    if (selectedComponents.size > 1) {
      return this.selectionManager.updateMultiSelectMode();
    }
    return false;
  }

  private handleComponentMove(e: MouseEvent, mousePos: MousePoint): void {
    if (!this.tempPosition) return;

    const delta = {
      x: mousePos.x - this.tempPosition.x,
      y: mousePos.y - this.tempPosition.y,
    };

    const selectedComponents = this.selectionManager.getSelectedComponents();
    for (const component of selectedComponents) {
      if (this.activeManager.currentActive === "move") {
        component.moveComponent(e, delta);
      }
    }

    this.selectionManager.updateMultiSelectRange(delta);
  }

  private handleComponentResize(mousePos: MousePoint): void {
    if (!this.tempPosition || !this.resizeEdge) return;

    // Get current ranges and cache them locally
    const multiSelectRange = this.selectionManager.getMultiSelectRange();
    const originMultiSelectRange = this.selectionManager.getOriginMultiSelectRange();

    if (!originMultiSelectRange || !multiSelectRange) return;

    // Make local copies to prevent race conditions
    const currentMultiSelectRange = { ...multiSelectRange };
    const currentOriginMultiSelectRange = { ...originMultiSelectRange };

    const mouseDistance = {
      x: mousePos.x - this.tempPosition.x,
      y: mousePos.y - this.tempPosition.y,
    };

    const multiRangePadding = 10;

    // Handle resize logic for each edge/corner
    const result = this.handleResizeLogic(
      mousePos,
      mouseDistance,
      currentMultiSelectRange,
      currentOriginMultiSelectRange,
      multiRangePadding
    );

    // Apply changes back to SelectionManager
    this.selectionManager.setMultiSelectRange(currentMultiSelectRange);
    if (result.newOriginRange) {
      this.selectionManager.setOriginMultiSelectRange(result.newOriginRange);
    }

    // Update components only if resize edge didn't change
    if (!result.resizeEdgeChanged) {
      const selectedComponents = this.selectionManager.getSelectedComponents();
      for (const component of selectedComponents) {
        component.resizeComponent(mouseDistance, currentOriginMultiSelectRange, this.resizeEdge);
      }
    }
  }

  private handleResizeLogic(
    mousePos: MousePoint,
    mouseDistance: { x: number; y: number },
    multiSelectRange: DragRange,
    originMultiSelectRange: DragRange,
    multiRangePadding: number
  ): { resizeEdgeChanged: boolean; newOriginRange?: DragRange } {
    return { resizeEdgeChanged: false };
  }

  private resetComponentPositions(): void {
    const selectedComponents = this.selectionManager.getSelectedComponents();
    for (const component of selectedComponents) {
      component.initialPosition();
    }
  }

  private handleHoverEffects(e: MouseEvent, mouse: MousePoint): void {
    // Handle multi-select range hover
    const multiSelectRange = this.selectionManager.getMultiSelectRange();
    if (multiSelectRange) {
      const zone = this.selectionManager.getMultiSelectHoverZone(mouse);
      if (zone !== "outside") {
        const cursorStyle = this.selectionManager.getCursorStyleForZone(zone);
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
  }

  private findComponentWithPosition(e: MouseEvent): BaseComponent | null {
    for (const component of this.components) {
      if (component.isClicked(e)) {
        return component;
      }
    }
    return null;
  }

  private addEventListeners(): void {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
  }

  public removeEventListeners(): void {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
  }
}
