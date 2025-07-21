import { BaseTool } from "../tools";

export type ToolNames = "drag" | "line";

export type ToolConstructor = new (props: any) => BaseTool;
