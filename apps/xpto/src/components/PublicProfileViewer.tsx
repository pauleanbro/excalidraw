"use client";

import { useEffect, useState } from "react";

type PublicProfileViewerProps = {
  scene: {
    elements?: readonly any[];
    appState?: Record<string, unknown>;
    files?: Record<string, unknown>;
  };
};

export default function PublicProfileViewer({
  scene,
}: PublicProfileViewerProps) {
  const [Comp, setComp] = useState<{ Excalidraw: any } | null>(null);

  useEffect(() => {
    (async () => {
      const mod = await import("@excalidraw/excalidraw");
      await import("@excalidraw/excalidraw/index.css");
      setComp({ Excalidraw: mod.Excalidraw });
    })();
  }, []);

  if (!Comp) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f7f5f1]">
        <p className="text-sm text-[#5f665a]">Carregando…</p>
      </div>
    );
  }

  const { Excalidraw } = Comp;

  return (
    <div className="h-screen w-screen">
      <Excalidraw
        initialData={{
          elements: scene.elements ?? [],
          appState: {
            ...(scene.appState ?? {}),
            viewBackgroundColor:
              (scene.appState?.viewBackgroundColor as string) ?? "#f7f5f1",
            collaborators: new Map(),
          },
          files: scene.files ?? {},
        }}
        viewModeEnabled={true}
        zenModeEnabled={true}
        gridModeEnabled={false}
        langCode="pt-BR"
        theme={(scene.appState?.theme as "light" | "dark") ?? "light"}
      />
    </div>
  );
}
