import { clearAppStateForDatabase } from "@excalidraw/excalidraw/appState";
import { filterOutDeletedFiles } from "@excalidraw/excalidraw/data/json";
import { getNonDeletedElements } from "@excalidraw/element";

import type {
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/element/types";

type FetchLike = typeof fetch;

export type PersistedSceneData = {
  elements: readonly NonDeletedExcalidrawElement[];
  appState: Partial<AppState>;
  files?: BinaryFiles;
};

export type PersistedSceneRecord = PersistedSceneData & {
  id: string;
  slug?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
};

export type SceneSaveInput = {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
};

export type PrepareSceneForSaveOptions = {
  includeFiles?: boolean;
};

export const prepareSceneForSave = (
  input: SceneSaveInput,
  options: PrepareSceneForSaveOptions = {},
): PersistedSceneData => {
  const { includeFiles = true } = options;

  const elements = getNonDeletedElements(input.elements);
  const appState = clearAppStateForDatabase(input.appState);

  return {
    elements,
    appState,
    files: includeFiles ? filterOutDeletedFiles(elements, input.files) : {},
  };
};

export const toExcalidrawInitialData = (
  scene: PersistedSceneData | null | undefined,
): ExcalidrawInitialDataState | null => {
  if (!scene) {
    return null;
  }

  return {
    elements: scene.elements,
    appState: scene.appState,
    files: scene.files ?? {},
  };
};

type AdapterOptions = {
  baseUrl: string;
  fetchImpl?: FetchLike;
  getAuthToken?: () =>
    | string
    | null
    | undefined
    | Promise<string | null | undefined>;
  defaultHeaders?: Record<string, string>;
};

type RequestOptions = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  signal?: AbortSignal;
};

export class ScenePersistenceAdapter {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly getAuthToken?: AdapterOptions["getAuthToken"];
  private readonly defaultHeaders?: AdapterOptions["defaultHeaders"];

  constructor(options: AdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.getAuthToken = options.getAuthToken;
    this.defaultHeaders = options.defaultHeaders;
  }

  public async createScene(
    input: SceneSaveInput,
    options: PrepareSceneForSaveOptions & { signal?: AbortSignal } = {},
  ): Promise<PersistedSceneRecord> {
    const payload = prepareSceneForSave(input, options);
    return this.request<PersistedSceneRecord>({
      method: "POST",
      path: "/scenes",
      body: payload,
      signal: options.signal,
    });
  }

  public async updateScene(
    sceneId: string,
    input: SceneSaveInput,
    options: PrepareSceneForSaveOptions & { signal?: AbortSignal } = {},
  ): Promise<PersistedSceneRecord> {
    const payload = prepareSceneForSave(input, options);
    return this.request<PersistedSceneRecord>({
      method: "PATCH",
      path: `/scenes/${encodeURIComponent(sceneId)}`,
      body: payload,
      signal: options.signal,
    });
  }

  public async getScene(
    sceneId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<PersistedSceneRecord> {
    return this.request<PersistedSceneRecord>({
      method: "GET",
      path: `/scenes/${encodeURIComponent(sceneId)}`,
      signal: options.signal,
    });
  }

  public async deleteScene(
    sceneId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<void> {
    await this.request<void>({
      method: "DELETE",
      path: `/scenes/${encodeURIComponent(sceneId)}`,
      signal: options.signal,
    });
  }

  private async request<T>(opts: RequestOptions): Promise<T> {
    const authToken = this.getAuthToken ? await this.getAuthToken() : null;

    const headers: Record<string, string> = {
      ...(this.defaultHeaders ?? {}),
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    const response = await this.fetchImpl(`${this.baseUrl}${opts.path}`, {
      method: opts.method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });

    if (!response.ok) {
      let details = "";
      try {
        details = await response.text();
      } catch {
        // ignore
      }
      throw new Error(
        `Scene API error (${response.status} ${response.statusText})${
          details ? `: ${details}` : ""
        }`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
