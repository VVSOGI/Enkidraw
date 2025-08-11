import { Active } from "../types";

export class ActiveManager {
  currentActive: Active = "default";

  public selectCurrentActive = (act: Active) => {
    this.currentActive = act;
  };

  public setCursorStyle = () => {
    if (this.currentActive === "drag") return "default";
    if (this.currentActive === "hand") return "grab";

    return this.currentActive;
  };
}
