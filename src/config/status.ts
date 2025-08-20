import { Active } from "../types";

interface SkipActiveStatus {
  "component-interaction-manager": Set<string>;
}

type SkipActiveStatusNames = keyof SkipActiveStatus;

const skipActiveStatus: SkipActiveStatus = {
  "component-interaction-manager": new Set(["grab", "grabbing", "line", "text"]),
};

export const checkSkipStatus = (name: SkipActiveStatusNames, status: Active) => {
  return skipActiveStatus[name].has(status);
};
