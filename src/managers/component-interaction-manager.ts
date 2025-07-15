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
  private removeSelectedComponents: () => void;

  private tempPosition: MousePoint | null = null;
  private resizeEdge: EdgeDirection | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    activeManager: ActiveManager,
    selectionManager: SelectionManager,
    components: Set<BaseComponent>,
    removeSelectedComponents: () => void
  ) {
    this.canvas = canvas;
    this.activeManager = activeManager;
    this.selectionManager = selectionManager;
    this.components = components;
    this.removeSelectedComponents = removeSelectedComponents;
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

    if (this.activeManager.currentActive === "resize") {
      this.selectionManager.updateMultiSelectMode();
    }

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

    // Handle resize logic for each edge/corner
    this.handleResizeLogic(mouseDistance, currentMultiSelectRange, currentOriginMultiSelectRange);

    // Apply changes back to SelectionManager
    this.selectionManager.setMultiSelectRange(currentMultiSelectRange);

    // Update components only if resize edge didn't change
    const selectedComponents = this.selectionManager.getSelectedComponents();
    for (const component of selectedComponents) {
      component.resizeComponent(mouseDistance, currentOriginMultiSelectRange, this.resizeEdge);
    }
  }

  private handleResizeLogic(
    mouseDistance: { x: number; y: number },
    multiSelectRange: DragRange,
    originMultiSelectRange: DragRange
  ) {
    if (this.resizeEdge === "left") {
      const newX1 = originMultiSelectRange.x1 + mouseDistance.x;
      multiSelectRange.x1 = newX1;
    }

    if (this.resizeEdge === "right") {
      const newX2 = originMultiSelectRange.x2 + mouseDistance.x;
      multiSelectRange.x2 = newX2;
    }

    if (this.resizeEdge === "top") {
      const newY1 = originMultiSelectRange.y1 + mouseDistance.y;
      multiSelectRange.y1 = newY1;
    }

    if (this.resizeEdge === "bottom") {
      const newY2 = originMultiSelectRange.y2 + mouseDistance.y;
      multiSelectRange.y2 = newY2;
    }

    if (this.resizeEdge === "top-left") {
      multiSelectRange.x1 = originMultiSelectRange.x1 + mouseDistance.x;
      multiSelectRange.y1 = originMultiSelectRange.y1 + mouseDistance.y;
    }

    if (this.resizeEdge === "top-right") {
      multiSelectRange.x2 = originMultiSelectRange.x2 + mouseDistance.x;
      multiSelectRange.y1 = originMultiSelectRange.y1 + mouseDistance.y;
    }

    if (this.resizeEdge === "bottom-left") {
      multiSelectRange.x1 = originMultiSelectRange.x1 + mouseDistance.x;
      multiSelectRange.y2 = originMultiSelectRange.y2 + mouseDistance.y;
    }

    if (this.resizeEdge === "bottom-right") {
      multiSelectRange.x2 = originMultiSelectRange.x2 + mouseDistance.x;
      multiSelectRange.y2 = originMultiSelectRange.y2 + mouseDistance.y;
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

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const selectedComponents = this.selectionManager.getSelectedComponents();

      if (selectedComponents.size > 0) {
        this.removeSelectedComponents();
      }
    }
  };

  private addEventListeners(): void {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);

    document.addEventListener("keydown", this.onKeyDown);
  }

  public removeEventListeners(): void {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("keydown", this.onKeyDown);
  }
}
