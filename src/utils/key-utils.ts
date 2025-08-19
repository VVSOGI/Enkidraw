const usingKeycodes = new Set(["Digit1", "Digit2", "Digit3", "KeyH"]);

export class KeyUtils {
  static isExistKeyCode = (keycode: string): boolean => {
    return usingKeycodes.has(keycode);
  };
}
