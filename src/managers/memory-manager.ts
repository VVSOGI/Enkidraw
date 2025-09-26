import { BaseComponent } from "../components";
import { ComponentManager } from "./component-manager";

type Action = "add" | "delete" | "move";

export class MemoryManager {
  private controlRedoStack: Array<[BaseComponent | BaseComponent[], Action]> = [];
  private controlBackRedoStack: Array<[BaseComponent | BaseComponent[], Action]> = [];

  public addRedoStack = (component: BaseComponent | BaseComponent[], action: Action) => {
    this.controlRedoStack.push([component, action]);
  };

  /**
   * Ctrl + Z
   */
  public redo = (componentManager: ComponentManager) => {
    const beforeAction = this.controlRedoStack.pop();
    if (beforeAction) {
      this.controlBackRedoStack.push(beforeAction);
    }

    if (beforeAction) {
      const [components, action] = beforeAction;

      if (action === "move") {
        if (Array.isArray(components)) {
          for (const component of components) {
            const findComponent = componentManager.findComponent(component.id);
            if (findComponent) {
              findComponent.position = component.originPosition;
              findComponent.initialPosition();
            }
          }
        } else {
          const findComponent = componentManager.findComponent(components.id);
          if (findComponent) {
            findComponent.position = components.originPosition;
            findComponent.initialPosition();
          }
        }
      }

      if (action === "add") {
        if (Array.isArray(components)) {
          componentManager.components = componentManager.components.filter((exist) => {
            for (const component of components) {
              if (exist.id === component.id) {
                return false;
              }
            }

            return true;
          });
        } else {
          componentManager.components = componentManager.components.filter((exist) => exist.id !== components.id);
        }
      }

      if (action === "delete") {
        if (Array.isArray(components)) {
          componentManager.components = [...componentManager.components, ...components];
        } else {
          componentManager.components = [...componentManager.components, components];
        }
      }
    }
  };

  /**
   * Ctrl + Y
   */
  public undo = (componentManager: ComponentManager) => {
    const beforeRedoAction = this.controlBackRedoStack.pop();
    if (beforeRedoAction) {
      this.controlRedoStack.push(beforeRedoAction);
    }

    if (beforeRedoAction) {
      const [components, action] = beforeRedoAction;

      if (action === "move") {
        if (Array.isArray(components)) {
          for (const component of components) {
            const findComponent = componentManager.findComponent(component.id);
            if (findComponent) {
              findComponent.position = component.position;
              findComponent.initialPosition();
            }
          }
        } else {
          const findComponent = componentManager.findComponent(components.id);
          if (findComponent) {
            findComponent.position = components.position;
            findComponent.initialPosition();
          }
        }
      }

      if (action === "add") {
        if (Array.isArray(components)) {
          componentManager.components = [...componentManager.components, ...components];
        } else {
          componentManager.components = [...componentManager.components, components];
        }
      }

      if (action === "delete") {
        if (Array.isArray(components)) {
          componentManager.components = componentManager.components.filter((exist) => {
            for (const component of components) {
              if (exist.id === component.id) {
                return false;
              }
            }

            return true;
          });
        } else {
          componentManager.components = componentManager.components.filter((exist) => exist.id !== components.id);
        }
      }
    }
  };
}
