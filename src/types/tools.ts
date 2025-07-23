import { BaseTool } from "../tools";

export type ToolNames = "drag" | "line" | "zoom" | "hand";

export type ToolConstructor = new (...args: any) => BaseTool;
