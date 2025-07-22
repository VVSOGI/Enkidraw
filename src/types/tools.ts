import { BaseTool } from "../tools";

export type ToolNames = "drag" | "line" | "zoom";

export type ToolConstructor = new (props: any) => BaseTool;
