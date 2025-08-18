import { BaseComponent, BasePosition } from "../components";
import { STYLE_SYSTEM } from "../utils";

export class LeftMenuManager {
  public styleMenu: HTMLDivElement;

  private components: BaseComponent<BasePosition>[] = [];
  private strokeButtons: HTMLButtonElement[];
  private currentStrokeColor: string;
  private currentStrokeColorButton!: HTMLButtonElement;

  constructor() {
    this.currentStrokeColor = STYLE_SYSTEM.BLACK;

    const colors = {
      black: STYLE_SYSTEM.BLACK,
      red: STYLE_SYSTEM.RED,
      green: STYLE_SYSTEM.GREEN,
      blue: STYLE_SYSTEM.BLUE,
      yellow: STYLE_SYSTEM.YELLOW,
    };

    const buttons = Object.entries(colors).map(([name, color]) => {
      const button = document.createElement("button");
      button.setAttribute("class", name + "-stroke");
      this.adjustColorButtonStyle(button, color);
      return button;
    });

    this.strokeButtons = buttons;
    this.styleMenu = this.appendLeftMenu();
    this.appendStrokeColorTab();
  }

  public setComponents(components: BaseComponent<BasePosition>[]): void {
    this.components = components;
  }

  get strokeColor(): string {
    return this.currentStrokeColor;
  }

  set strokeColor(color: string) {
    this.currentStrokeColor = color;
    if (this.currentStrokeColorButton) {
      this.currentStrokeColorButton.style.backgroundColor = color;
    }
  }

  public activate = () => {
    this.styleMenu.style.display = "flex";
  };

  public deactivate = () => {
    this.styleMenu.style.display = "none";
  };

  private appendLeftMenu = () => {
    const styleMenu = document.createElement("div");
    styleMenu.setAttribute("class", "left-menu");
    styleMenu.style.position = "absolute";
    styleMenu.style.height = "fit-content";
    styleMenu.style.top = "60px";
    styleMenu.style.left = "15px";
    styleMenu.style.display = "none";
    styleMenu.style.gap = "12px";
    styleMenu.style.padding = "16px 12px";

    styleMenu.style.borderRadius = "8px";
    styleMenu.style.backgroundColor = STYLE_SYSTEM.WHITE;
    styleMenu.style.boxShadow = STYLE_SYSTEM.SHADOW_PRIMARY;

    document.body.appendChild(styleMenu);
    return styleMenu;
  };

  private appendStrokeColorTab = () => {
    const strokeColorTab = document.createElement("div");
    const title = this.createTabTitle("Stroke Color");
    strokeColorTab.style.width = "100%";
    strokeColorTab.appendChild(title);

    const colors = document.createElement("div");
    colors.style.display = "flex";
    colors.style.gap = "4px";
    colors.style.alignItems = "center";

    this.strokeButtons.forEach((button) => colors.appendChild(button));
    strokeColorTab.appendChild(colors);

    const divider = document.createElement("div");
    divider.style.width = "1px";
    divider.style.minHeight = "20px";
    divider.style.backgroundColor = "#e1e1e1";
    divider.style.margin = "0 10px";

    this.currentStrokeColorButton = document.createElement("button");
    this.adjustCurrentColorButtonStyle(this.currentStrokeColorButton, this.strokeColor);

    colors.appendChild(divider);
    colors.appendChild(this.currentStrokeColorButton);

    this.styleMenu.appendChild(strokeColorTab);
  };

  private adjustColorButtonStyle = (button: HTMLButtonElement, color: string) => {
    button.style.backgroundColor = color;
    button.style.width = "25px";
    button.style.height = "25px";
    button.style.outline = "none";
    button.style.border = "none";
    button.style.borderRadius = "4px";

    button.addEventListener("mouseover", () => {
      button.style.scale = "1.05";
      button.style.cursor = "pointer";
    });
    button.addEventListener("mouseleave", () => {
      button.style.scale = "1";
      button.style.cursor = "default";
    });

    button.addEventListener("click", () => {
      for (const component of this.components) {
        component.color = color;
      }
      this.strokeColor = color;
      button.style.outline = "1px solid black";
      button.style.border = "1px solid white";

      for (const check of this.strokeButtons) {
        if (check.className === button.className) continue;
        check.style.outline = "none";
        check.style.border = "none";
      }
    });
  };

  private adjustCurrentColorButtonStyle = (button: HTMLButtonElement, color: string) => {
    button.style.backgroundColor = color;
    button.style.width = "25px";
    button.style.height = "25px";
    button.style.outline = "none";
    button.style.border = "none";
    button.style.borderRadius = "4px";
    button.style.cursor = "default"; // 클릭할 수 없음을 표시
  };

  private createTabTitle = (title: string) => {
    const tabTitle = document.createElement("h4");
    tabTitle.textContent = title;
    tabTitle.style.fontWeight = "500";
    tabTitle.style.fontSize = "14px";
    tabTitle.style.marginBottom = "8px";
    return tabTitle;
  };
}
