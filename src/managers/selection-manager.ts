import { BaseComponent } from "../components";
import { DragRange, EdgeDirection, MousePoint, CursorStyle } from "../types";

export class SelectionManager {
  private selectedComponents: Set<BaseComponent>;
  private multiSelectRange: DragRange | null = null;
  private originMultiSelectRange: DragRange | null = null;
  private multiRangePadding = 10;
  private multiResizeRange = 5;

  constructor() {
    this.selectedComponents = new Set();
  }

  public getSelectedComponents(): Set<BaseComponent> {
    return this.selectedComponents;
  }

  public getMultiSelectRange(): DragRange | null {
    return this.multiSelectRange;
  }

  public getOriginMultiSelectRange(): DragRange | null {
    return this.originMultiSelectRange;
  }

  public getMultiSelectRangeRef(): { multiSelectRange: DragRange | null; originMultiSelectRange: DragRange | null } {
    return {
      multiSelectRange: this.multiSelectRange,
      originMultiSelectRange: this.originMultiSelectRange,
    };
  }

  public setMultiSelectRange(range: DragRange | null): void {
    this.multiSelectRange = range;
  }

  public setOriginMultiSelectRange(range: DragRange | null): void {
    this.originMultiSelectRange = range;
  }

  public selectComponent(component: BaseComponent): void {
    this.clearSelection();
    this.selectedComponents.add(component);
    component.activate();
  }

  public dragComponents(components: Set<BaseComponent>, dragRange: DragRange): void {
    const { x1: dragX1, y1: dragY1, x2: dragX2, y2: dragY2 } = dragRange;

    for (const component of components) {
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

    // All Selected Components deactivated When selected component more than 1
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
  }

  public updateMultiSelectMode(): boolean {
    if (this.selectedComponents.size > 1) {
      const multiRange = this.calculateMultiSelectBounds();
      this.multiSelectRange = Object.assign({}, multiRange);
      this.originMultiSelectRange = Object.assign({}, multiRange);
      return true;
    }
    return false;
  }

  public updateMultiSelectRange(delta: { x: number; y: number }): void {
    if (this.multiSelectRange && this.originMultiSelectRange) {
      this.multiSelectRange.x1 = this.originMultiSelectRange.x1 + delta.x;
      this.multiSelectRange.y1 = this.originMultiSelectRange.y1 + delta.y;
      this.multiSelectRange.x2 = this.originMultiSelectRange.x2 + delta.x;
      this.multiSelectRange.y2 = this.originMultiSelectRange.y2 + delta.y;
    }
  }

  public getMultiSelectHoverZone(mouse: MousePoint): EdgeDirection | "inside" | "outside" {
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
  }

  public getCursorStyleForZone(zone: ReturnType<typeof this.getMultiSelectHoverZone>): CursorStyle {
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
  }

  public clearSelection(): void {
    for (const component of this.selectedComponents) {
      component.deactivate();
      component.multiDragMode(false);
    }
    this.multiSelectRange = null;
    this.originMultiSelectRange = null;
    this.selectedComponents.clear();
  }

  public resetOriginMultiSelectRange(): void {
    this.originMultiSelectRange = Object.assign({}, this.multiSelectRange);
  }

  private calculateMultiSelectBounds(): DragRange {
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
  }
}
