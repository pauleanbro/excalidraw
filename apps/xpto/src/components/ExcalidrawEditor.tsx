"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

type Theme = "light" | "dark";

type ExcalidrawEditorProps = {
  profileId: string;
  initialScene: {
    elements?: readonly any[];
    appState?: Record<string, unknown>;
    files?: Record<string, unknown>;
  };
  templateData?: {
    userName?: string;
    userAvatarUrl?: string;
  };
  allowTemplates?: boolean;
  unsplashAccessKey?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

const SAVE_DEBOUNCE_MS = 2_000;
const MAX_FREE_ELEMENTS = Number(
  process.env.NEXT_PUBLIC_MAX_FREE_ELEMENTS || 0,
);

export default function ExcalidrawEditor({
  profileId,
  initialScene,
  templateData,
  allowTemplates,
  unsplashAccessKey,
  isFullscreen,
  onToggleFullscreen,
}: ExcalidrawEditorProps) {
  const [Comp, setComp] = useState<{
    Excalidraw: any;
    serializeAsJSON: any;
  } | null>(null);

  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [theme, setTheme] = useState<Theme>(
    (initialScene.appState?.theme as Theme) ?? "light",
  );

  useEffect(() => {
    (async () => {
      const mod = await import("@excalidraw/excalidraw");
      await import("@excalidraw/excalidraw/index.css");
      setComp({
        Excalidraw: mod.Excalidraw,
        serializeAsJSON: mod.serializeAsJSON,
      });
    })();
  }, []);

  const persistScene = useCallback(
    async (serialized: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/profiles/${profileId}/scene`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scene: JSON.parse(serialized) }),
        });
        setSaveStatus(res.ok ? "saved" : "error");
      } catch {
        setSaveStatus("error");
      }
    },
    [profileId],
  );

  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (!Comp) return;

      // Keep theme in sync with editor state
      const editorTheme = appState?.theme as Theme | undefined;
      if (editorTheme && editorTheme !== theme) {
        setTheme(editorTheme);
      }

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        const json = Comp.serializeAsJSON(
          elements,
          appState,
          files,
          "database",
        );
        // serializeAsJSON("database") strips files and some appState fields.
        // Re-inject files and theme so they persist for public viewing.
        const parsed = JSON.parse(json);

        // Include only serializable file data (id, dataURL, mimeType)
        if (files && typeof files === "object") {
          const cleanFiles: Record<string, unknown> = {};
          for (const [id, file] of Object.entries(files)) {
            if (file && typeof file === "object" && "dataURL" in file) {
              cleanFiles[id] = {
                id: (file as any).id ?? id,
                dataURL: (file as any).dataURL,
                mimeType: (file as any).mimeType,
                created: (file as any).created ?? Date.now(),
              };
            }
          }
          parsed.files = cleanFiles;
        }

        if (appState?.theme) {
          parsed.appState = { ...parsed.appState, theme: appState.theme };
        }
        persistScene(JSON.stringify(parsed));
      }, SAVE_DEBOUNCE_MS);
    },
    [Comp, persistScene, theme],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  if (!Comp) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[#5f665a]">Carregando editor…</p>
      </div>
    );
  }

  const { Excalidraw } = Comp;

  // Downgrade enforcement on editor open:
  // 1. Strip premium-only elements when user is not PRO
  // 2. Trim remaining elements to maxElements plan limit
  const maxElements = allowTemplates ? undefined : MAX_FREE_ELEMENTS || undefined;
  const rawElements = initialScene.elements ?? [];
  const enforcedElements = (() => {
    let els = rawElements as readonly Record<string, any>[];

    // Remove premium elements if user lost PRO access
    if (!allowTemplates) {
      els = els.filter((el) => !el.customData?.premium);
    }

    // Trim to plan element limit (keep oldest)
    if (maxElements && els.length > maxElements) {
      els = els.slice(0, maxElements);
    }

    return els;
  })();

  return (
    <div className="relative h-full w-full">
      <Excalidraw
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
          apiRef.current = api;
        }}
        initialData={{
          elements: enforcedElements,
          appState: {
            ...(initialScene.appState ?? {}),
            collaborators: new Map(),
          },
          files: initialScene.files ?? {},
        }}
        langCode="pt-BR"
        theme={theme}
        onChange={handleChange}
        maxElements={maxElements}
        templateData={templateData}
        allowTemplates={allowTemplates}
        unsplashAccessKey={unsplashAccessKey}
      />

      {/* Top-right controls */}
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          className={`flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold shadow-sm backdrop-blur-sm transition-all hover:-translate-y-px hover:shadow-md ${
            theme === "dark"
              ? "border-[rgba(255,255,255,0.12)] bg-[rgba(30,30,30,0.84)] text-[#d4d4d4]"
              : "border-[rgba(111,131,103,0.18)] bg-[rgba(255,255,255,0.84)] text-[#2f3b2c]"
          }`}
        aria-label={theme === "light" ? "Mudar para tema escuro" : "Mudar para tema claro"}
      >
        <span
          className={`relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full transition-colors ${
            theme === "dark" ? "bg-[#555]" : "bg-[#ddd8cd]"
          }`}
        >
          <span
            className={`absolute h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform ${
              theme === "dark" ? "translate-x-[16px]" : "translate-x-[2px]"
            }`}
          />
        </span>
        {theme === "light" ? "☀️ Light" : "🌙 Dark"}
        </button>
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition-all hover:-translate-y-px hover:shadow-md ${
              theme === "dark"
                ? "border-[rgba(255,255,255,0.12)] bg-[rgba(30,30,30,0.84)] text-[#d4d4d4]"
                : "border-[rgba(111,131,103,0.18)] bg-[rgba(255,255,255,0.84)] text-[#2f3b2c]"
            }`}
            aria-label={isFullscreen ? "Sair do fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
            )}
          </button>
        )}
      </div>

      {/* Save status */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-50">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${
            saveStatus === "saving"
              ? "bg-amber-50/80 text-amber-700"
              : saveStatus === "saved"
                ? "bg-emerald-50/80 text-emerald-700"
                : saveStatus === "error"
                  ? "bg-red-50/80 text-red-700"
                  : "bg-white/60 text-[#5f665a]"
          }`}
        >
          {saveStatus === "saving" && "Salvando…"}
          {saveStatus === "saved" && "Salvo"}
          {saveStatus === "error" && "Erro ao salvar"}
          {saveStatus === "idle" && ""}
        </span>
      </div>
    </div>
  );
}
