import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { BinaryFileData } from "../types";

export type TemplateResult = {
  elements: readonly ExcalidrawElement[];
  files: BinaryFileData[];
};

export type TemplateCategory = "cards" | "headers" | "rows" | "frames";
