import { BaseComponent } from "../components";
import { DragRange, EdgeDirection, MousePoint } from "../types";
import { MouseUtils } from "../utils";
import { ActiveManager } from "./active-manager";

export class ComponentManager {
  public components: Set<BaseComponent>;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected activeManager: ActiveManager;

  private selectedComponents: Set<BaseComponent>;
  private tempPosition: MousePoint | null = null;
  private resizeEdge: EdgeDirection | null = null;

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
   * Handle component resizing
   */
  private handleComponentResize = (e: MouseEvent, mousePos: MousePoint) => {
    if (!this.tempPosition || !this.resizeEdge || !this.originMultiSelectRange || !this.multiSelectRange) return;

    const mouseDistance = {
      x: mousePos.x - this.tempPosition.x,
      y: mousePos.y - this.tempPosition.y,
    };

    // Left resize
    if (this.resizeEdge === "left") {
      const newX1 = this.originMultiSelectRange.x1 + mouseDistance.x;

      // Switch to right resize when left wall touches right wall
      if (newX1 >= this.multiSelectRange.x2 - this.multiRangePadding) {
        this.resizeEdge = "right";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentWidth = this.multiSelectRange.x2 - this.multiSelectRange.x1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          x1: this.multiSelectRange.x2 - currentWidth,
          x2: this.multiSelectRange.x2,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      this.multiSelectRange = {
        ...this.multiSelectRange,
        x1: newX1,
      };
    }

    // Right resize
    if (this.resizeEdge === "right") {
      const newX2 = this.originMultiSelectRange.x2 + mouseDistance.x;

      // Switch to left resize when right wall touches left wall
      if (newX2 <= this.multiSelectRange.x1 + this.multiRangePadding) {
        this.resizeEdge = "left";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentWidth = this.multiSelectRange.x2 - this.multiSelectRange.x1;
        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          x1: this.multiSelectRange.x1,
          x2: this.multiSelectRange.x1 + currentWidth,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      this.multiSelectRange = {
        ...this.multiSelectRange,
        x2: newX2,
      };
    }

    // Top resize
    if (this.resizeEdge === "top") {
      const newY1 = this.originMultiSelectRange.y1 + mouseDistance.y;

      // Switch to bottom resize when top wall touches bottom wall
      if (newY1 >= this.multiSelectRange.y2 - this.multiRangePadding) {
        this.resizeEdge = "bottom";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentHeight = this.multiSelectRange.y2 - this.multiSelectRange.y1;
        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          y1: this.multiSelectRange.y2 - currentHeight,
          y2: this.multiSelectRange.y2,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      this.multiSelectRange = {
        ...this.multiSelectRange,
        y1: newY1,
      };
    }

    // Bottom resize
    if (this.resizeEdge === "bottom") {
      const newY2 = this.originMultiSelectRange.y2 + mouseDistance.y;

      // Switch to top resize when bottom wall touches top wall
      if (newY2 <= this.multiSelectRange.y1 + this.multiRangePadding) {
        this.resizeEdge = "top";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentHeight = this.multiSelectRange.y2 - this.multiSelectRange.y1;
        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          y1: this.multiSelectRange.y1,
          y2: this.multiSelectRange.y1 + currentHeight,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      this.multiSelectRange = {
        ...this.multiSelectRange,
        y2: newY2,
      };
    }

    // Top-left corner resize
    if (this.resizeEdge === "top-left") {
      const newX1 = this.originMultiSelectRange.x1 + mouseDistance.x;
      const newY1 = this.originMultiSelectRange.y1 + mouseDistance.y;

      // Switch to bottom-right when both walls touch
      if (
        newX1 >= this.multiSelectRange.x2 - this.multiRangePadding &&
        newY1 >= this.multiSelectRange.y2 - this.multiRangePadding
      ) {
        this.resizeEdge = "bottom-right";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentWidth = this.multiSelectRange.x2 - this.multiSelectRange.x1;
        const currentHeight = this.multiSelectRange.y2 - this.multiSelectRange.y1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          x1: this.multiSelectRange.x2 - currentWidth,
          y1: this.multiSelectRange.y2 - currentHeight,
          x2: this.multiSelectRange.x2,
          y2: this.multiSelectRange.y2,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      // Switch to top-right when left wall touches
      if (newX1 >= this.multiSelectRange.x2 - this.multiRangePadding) {
        this.resizeEdge = "top-right";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentWidth = this.multiSelectRange.x2 - this.multiSelectRange.x1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          x1: this.multiSelectRange.x2 - currentWidth,
          x2: this.multiSelectRange.x2,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      // Switch to bottom-left when top wall touches
      if (newY1 >= this.multiSelectRange.y2 - this.multiRangePadding) {
        this.resizeEdge = "bottom-left";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentHeight = this.multiSelectRange.y2 - this.multiSelectRange.y1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          y1: this.multiSelectRange.y2 - currentHeight,
          y2: this.multiSelectRange.y2,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      this.multiSelectRange = {
        ...this.multiSelectRange,
        x1: newX1,
        y1: newY1,
      };
    }

    // Top-right corner resize
    if (this.resizeEdge === "top-right") {
      const newX2 = this.originMultiSelectRange.x2 + mouseDistance.x;
      const newY1 = this.originMultiSelectRange.y1 + mouseDistance.y;

      // Switch to bottom-left when both walls touch
      if (
        newX2 <= this.multiSelectRange.x1 + this.multiRangePadding &&
        newY1 >= this.multiSelectRange.y2 - this.multiRangePadding
      ) {
        this.resizeEdge = "bottom-left";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentWidth = this.multiSelectRange.x2 - this.multiSelectRange.x1;
        const currentHeight = this.multiSelectRange.y2 - this.multiSelectRange.y1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          x1: this.multiSelectRange.x1,
          y1: this.multiSelectRange.y2 - currentHeight,
          x2: this.multiSelectRange.x1 + currentWidth,
          y2: this.multiSelectRange.y2,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      // Switch to top-left when right wall touches
      if (newX2 <= this.multiSelectRange.x1 + this.multiRangePadding) {
        this.resizeEdge = "top-left";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentWidth = this.multiSelectRange.x2 - this.multiSelectRange.x1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          x1: this.multiSelectRange.x1,
          x2: this.multiSelectRange.x1 + currentWidth,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      // Switch to bottom-right when top wall touches
      if (newY1 >= this.multiSelectRange.y2 - this.multiRangePadding) {
        this.resizeEdge = "bottom-right";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentHeight = this.multiSelectRange.y2 - this.multiSelectRange.y1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          y1: this.multiSelectRange.y2 - currentHeight,
          y2: this.multiSelectRange.y2,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      this.multiSelectRange = {
        ...this.multiSelectRange,
        x2: newX2,
        y1: newY1,
      };
    }

    // Bottom-left corner resize
    if (this.resizeEdge === "bottom-left") {
      const newX1 = this.originMultiSelectRange.x1 + mouseDistance.x;
      const newY2 = this.originMultiSelectRange.y2 + mouseDistance.y;

      // Switch to top-right when both walls touch
      if (
        newX1 >= this.multiSelectRange.x2 - this.multiRangePadding &&
        newY2 <= this.multiSelectRange.y1 + this.multiRangePadding
      ) {
        this.resizeEdge = "top-right";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentWidth = this.multiSelectRange.x2 - this.multiSelectRange.x1;
        const currentHeight = this.multiSelectRange.y2 - this.multiSelectRange.y1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          x1: this.multiSelectRange.x2 - currentWidth,
          y1: this.multiSelectRange.y1,
          x2: this.multiSelectRange.x2,
          y2: this.multiSelectRange.y1 + currentHeight,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      // Switch to bottom-right when left wall touches
      if (newX1 >= this.multiSelectRange.x2 - this.multiRangePadding) {
        this.resizeEdge = "bottom-right";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentWidth = this.multiSelectRange.x2 - this.multiSelectRange.x1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          x1: this.multiSelectRange.x2 - currentWidth,
          x2: this.multiSelectRange.x2,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      // Switch to top-left when bottom wall touches
      if (newY2 <= this.multiSelectRange.y1 + this.multiRangePadding) {
        this.resizeEdge = "top-left";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentHeight = this.multiSelectRange.y2 - this.multiSelectRange.y1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          y1: this.multiSelectRange.y1,
          y2: this.multiSelectRange.y1 + currentHeight,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      this.multiSelectRange = {
        ...this.multiSelectRange,
        x1: newX1,
        y2: newY2,
      };
    }

    // Bottom-right corner resize
    if (this.resizeEdge === "bottom-right") {
      const newX2 = this.originMultiSelectRange.x2 + mouseDistance.x;
      const newY2 = this.originMultiSelectRange.y2 + mouseDistance.y;

      // Switch to top-left when both walls touch
      if (
        newX2 <= this.multiSelectRange.x1 + this.multiRangePadding &&
        newY2 <= this.multiSelectRange.y1 + this.multiRangePadding
      ) {
        this.resizeEdge = "top-left";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentWidth = this.multiSelectRange.x2 - this.multiSelectRange.x1;
        const currentHeight = this.multiSelectRange.y2 - this.multiSelectRange.y1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          x1: this.multiSelectRange.x1,
          y1: this.multiSelectRange.y1,
          x2: this.multiSelectRange.x1 + currentWidth,
          y2: this.multiSelectRange.y1 + currentHeight,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      // Switch to bottom-left when right wall touches
      if (newX2 <= this.multiSelectRange.x1 + this.multiRangePadding) {
        this.resizeEdge = "bottom-left";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentWidth = this.multiSelectRange.x2 - this.multiSelectRange.x1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          x1: this.multiSelectRange.x1,
          x2: this.multiSelectRange.x1 + currentWidth,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      // Switch to top-right when bottom wall touches
      if (newY2 <= this.multiSelectRange.y1 + this.multiRangePadding) {
        this.resizeEdge = "top-right";
        this.tempPosition = mousePos;

        // Maintain current selection area size
        const currentHeight = this.multiSelectRange.y2 - this.multiSelectRange.y1;

        this.originMultiSelectRange = {
          ...this.multiSelectRange,
          y1: this.multiSelectRange.y1,
          y2: this.multiSelectRange.y1 + currentHeight,
        };

        // Set current position as originPosition for all components
        for (const component of this.selectedComponents) {
          component.initialPosition();
        }
        return;
      }

      this.multiSelectRange = {
        ...this.multiSelectRange,
        x2: newX2,
        y2: newY2,
      };
    }

    for (const component of this.selectedComponents) {
      component.resizeComponent(mouseDistance, this.originMultiSelectRange, this.resizeEdge);
    }
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
          this.resizeEdge = zone;
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
  private getMultiSelectHoverZone = (mouse: MousePoint): EdgeDirection | "inside" | "outside" => {
    if (!this.multiSelectRange) return "outside";

    const { x1: left, x2: right, y1: top, y2: bottom } = this.multiSelectRange;

    // Top-left corner
    if (
      mouse.x >= left - this.multiResizeRange &&
      mouse.x <= left + this.multiResizeRange &&
      mouse.y >= top - this.multiResizeRange &&
      mouse.y <= top + this.multiResizeRange
    ) {
      return "top-left";
    }

    // Top-right corner
    if (
      mouse.x >= right - this.multiResizeRange &&
      mouse.x <= right + this.multiResizeRange &&
      mouse.y >= top - this.multiResizeRange &&
      mouse.y <= top + this.multiResizeRange
    ) {
      return "top-right";
    }

    // Bottom-left corner
    if (
      mouse.x >= left - this.multiResizeRange &&
      mouse.x <= left + this.multiResizeRange &&
      mouse.y >= bottom - this.multiResizeRange &&
      mouse.y <= bottom + this.multiResizeRange
    ) {
      return "bottom-left";
    }

    // Bottom-right corner
    if (
      mouse.x >= right - this.multiResizeRange &&
      mouse.x <= right + this.multiResizeRange &&
      mouse.y >= bottom - this.multiResizeRange &&
      mouse.y <= bottom + this.multiResizeRange
    ) {
      return "bottom-right";
    }

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
      case "top-left":
      case "bottom-right":
        return "nw-resize";
      case "top-right":
      case "bottom-left":
        return "ne-resize";
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
