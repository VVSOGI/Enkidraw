import { BaseComponent, BasePosition } from "../components";
import { EdgeDirection, MousePoint } from "../types";
import { SelectedComponentManager } from ".";
import { ActiveManager } from "./active-manager";

export class ComponentInteractionManager {
  private canvas: HTMLCanvasElement;
  private activeManager: ActiveManager;
  private selectionManager: SelectedComponentManager;
  private components: BaseComponent<BasePosition>[];
  private removeSelectedComponents: () => void;
  private getZoomTransform?: () => { zoom: number; translateX: number; translateY: number };

  private tempPosition: MousePoint | null = null;
  private resizeEdge: EdgeDirection | null = null;
  private nonDefaultStates: Set<string> = new Set<string>(["grab", "grabbing", "line"]);

  constructor(
    canvas: HTMLCanvasElement,
    activeManager: ActiveManager,
    selectionManager: SelectedComponentManager,
    components: BaseComponent<BasePosition>[],
    removeSelectedComponents: () => void,
    getZoomTransform?: () => { zoom: number; translateX: number; translateY: number }
  ) {
    this.canvas = canvas;
    this.activeManager = activeManager;
    this.selectionManager = selectionManager;
    this.components = components;
    this.removeSelectedComponents = removeSelectedComponents;
    this.getZoomTransform = getZoomTransform;
    this.addEventListeners();
  }

  // 줌을 고려한 마우스 좌표 계산
  private getLogicalMousePos = (e: MouseEvent): MousePoint => {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const transform = this.getZoomTransform?.();
    if (!transform) {
      return { x: screenX, y: screenY };
    }

    return {
      x: (screenX - transform.translateX) / transform.zoom,
      y: (screenY - transform.translateY) / transform.zoom,
    };
  };

  public onMouseMove = (e: MouseEvent) => {
    if (this.nonDefaultStates.has(this.activeManager.currentActive)) {
      return;
    }

    const mousePos = this.getLogicalMousePos(e);

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

    // 3. Handle hover effects
    this.handleHoverEffects(e, mousePos);

    // 4. Handle component movement
    this.handleComponentMove(e, mousePos);
  };

  public onMouseDown = (e: MouseEvent) => {
    if (this.nonDefaultStates.has(this.activeManager.currentActive)) {
      return;
    }

    const mousePos = this.getLogicalMousePos(e);

    // Handle multi-select range interactions
    const multiSelectRange = this.selectionManager.getMultiSelectRange();

    if (multiSelectRange) {
      const zone = this.selectionManager.getMultiSelectHoverZone(mousePos);

      if (zone !== "outside") {
        this.tempPosition = mousePos;

        // Set appropriate mode based on zone
        if (zone === "inside") {
          this.activeManager.selectCurrentActive("move");
        } else {
          // Handle resize modes for edges
          this.resizeEdge = zone;
          this.activeManager.selectCurrentActive("resize");
        }

        return;
      }
    }

    const component = this.findComponentWithPosition(e);
    const selectedComponents = this.selectionManager.getSelectedComponents();

    if (component && selectedComponents.find((selected) => selected.id === component.id)) {
      this.tempPosition = mousePos;

      if (component.isTransformSelect) {
        const zone = component.getMultiSelectHoverZone(mousePos);

        if (zone === "outside") return;

        if (zone === "inside") {
          this.activeManager.selectCurrentActive("move");
          return;
        } else {
          this.resizeEdge = zone;
          this.activeManager.selectCurrentActive("resize");
          this.selectionManager.updateMultiSelectMode();
          return;
        }
      }

      this.activeManager.selectCurrentActive("move");
      return;
    }

    if (component) {
      this.selectionManager.selectComponent(component);
      this.activeManager.selectCurrentActive("move");
      this.tempPosition = mousePos;
    } else {
      this.selectionManager.clearSelection();
      this.activeManager.selectCurrentActive("default");
    }
  };

  public onMouseUp = (e: MouseEvent) => {
    if (this.nonDefaultStates.has(this.activeManager.currentActive)) {
      return;
    }

    this.tempPosition = null;
    this.selectionManager.resetOriginMultiSelectRange();

    if (this.activeManager.currentActive === "resize") {
      this.selectionManager.updateMultiSelectMode();
    }

    for (const component of this.components) {
      component.initialPosition();
    }

    this.activeManager.selectCurrentActive("default");
  };

  private handleMultiDragMode(): boolean {
    const selectedComponents = this.selectionManager.getSelectedComponents();
    if (selectedComponents.length > 1) {
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
      component.moveComponent(e, delta);
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

    // Update components only if resize edge didn't change
    const selectedComponents = this.selectionManager.getSelectedComponents();
    for (const component of selectedComponents) {
      component.resizeComponent(mouseDistance, currentOriginMultiSelectRange, this.resizeEdge);
    }

    let nextRange = {
      x1: Infinity,
      y1: Infinity,
      x2: -Infinity,
      y2: -Infinity,
    };

    for (const component of selectedComponents) {
      const { x1, y1, x2, y2 } = component.getPosition();
      nextRange.x1 = Math.min(nextRange.x1, x1);
      nextRange.y1 = Math.min(nextRange.y1, y1);
      nextRange.x2 = Math.max(nextRange.x2, x2);
      nextRange.y2 = Math.max(nextRange.y2, y2);
    }

    this.selectionManager.setMultiSelectRange(nextRange);
  }

  private handleHoverEffects(e: MouseEvent, mouse: MousePoint): void {
    // Handle multi-select range hover
    const multiSelectRange = this.selectionManager.getMultiSelectRange();
    if (multiSelectRange) {
      const zone = this.selectionManager.getMultiSelectHoverZone(mouse);
      if (zone !== "outside") {
        const cursorStyle = this.selectionManager.getCursorStyleForZone(zone);
        this.activeManager.selectCurrentActive(cursorStyle);
        return;
      } else {
        this.activeManager.selectCurrentActive("default");
      }

      return;
    }

    if (this.activeManager.currentActive === "move") return;

    // Handle individual component hover
    for (const component of this.components) {
      if (component.isHover(e)) {
        const zone = component.getMultiSelectHoverZone(mouse);
        if (zone === "outside") return;

        component.hoverComponent(e, mouse);

        if (zone === "inside") {
          this.activeManager.selectCurrentActive("pointer");
        } else {
          const cursorStyle = this.selectionManager.getCursorStyleForZone(zone);
          this.activeManager.selectCurrentActive(cursorStyle);
        }

        return;
      } else {
        this.activeManager.selectCurrentActive("default");
      }
    }
  }

  private findComponentWithPosition(e: MouseEvent): BaseComponent | null {
    for (const component of this.components.reverse()) {
      if (component.isClicked(e)) {
        return component;
      }
    }
    return null;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Backspace" || e.code === "Delete") {
      e.preventDefault();
      const selectedComponents = this.selectionManager.getSelectedComponents();

      if (selectedComponents.length > 0) {
        this.removeSelectedComponents();
      }

      this.activeManager.selectCurrentActive("default");
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
