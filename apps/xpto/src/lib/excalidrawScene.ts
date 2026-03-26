type UnknownRecord = Record<string, unknown>;

export type ExcalidrawStoredScene = {
  type?: string;
  version?: number;
  source?: string;
  elements?: unknown[];
  appState?: UnknownRecord;
  files?: UnknownRecord;
};

const isObject = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseJSON = (value: string) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

// Compatible with Excalidraw's serializeAsJSON(..., "database") output.
export const normalizeExcalidrawScene = (
  input: unknown,
): ExcalidrawStoredScene | null => {
  const raw = typeof input === "string" ? parseJSON(input) : input;
  if (!isObject(raw)) {
    return null;
  }

  if (raw.elements !== undefined && !Array.isArray(raw.elements)) {
    return null;
  }

  if (raw.appState !== undefined && !isObject(raw.appState)) {
    return null;
  }

  if (raw.files !== undefined && !isObject(raw.files)) {
    return null;
  }

  return {
    type: typeof raw.type === "string" ? raw.type : undefined,
    version: typeof raw.version === "number" ? raw.version : undefined,
    source: typeof raw.source === "string" ? raw.source : undefined,
    elements: Array.isArray(raw.elements) ? raw.elements : [],
    appState: isObject(raw.appState) ? raw.appState : {},
    files: isObject(raw.files) ? raw.files : {},
  };
};
