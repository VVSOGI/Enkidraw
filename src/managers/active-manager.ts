import { Active } from "../types";

export class ActiveManager {
  currentActive: Active = "default";

  public selectCurrentActive = (act: Active) => {
    this.currentActive = act;
  };
}
