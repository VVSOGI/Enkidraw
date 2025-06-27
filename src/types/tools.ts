import { BaseTool } from "../tools";

export type ToolNames = "drag" | "line";

export type ToolConstructor = new (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, ...props: any) => BaseTool;
