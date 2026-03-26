"use client";

import { useState, useTransition } from "react";

type ProfileSceneEditorProps = {
  profileId: string;
  initialSceneJSON: string;
};

export default function ProfileSceneEditor({
  profileId,
  initialSceneJSON,
}: ProfileSceneEditorProps) {
  const [sceneJSON, setSceneJSON] = useState(initialSceneJSON);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveScene = () => {
    startTransition(async () => {
      setMessage(null);

      let parsedScene: unknown;
      try {
        parsedScene = JSON.parse(sceneJSON);
      } catch {
        setMessage("JSON inválido. Revise o conteúdo antes de salvar.");
        return;
      }

      const response = await fetch(`/api/profiles/${profileId}/scene`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scene: parsedScene }),
      });

      if (!response.ok) {
        setMessage("Não foi possível salvar agora. Tente novamente.");
        return;
      }

      setMessage("Cena salva com sucesso no Postgres.");
    });
  };

  return (
    <section className="mt-5 rounded-2xl border border-[rgba(111,131,103,0.12)] bg-[#fdfbf6] p-5">
      <h2 className="font-display text-[1.6rem] leading-[1.05] text-[#20261f]">
        Cena do editor
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#5f665a]">
        Esta área recebe o payload serializado do Excalidraw e persiste no banco.
      </p>

      <textarea
        className="mt-4 min-h-[320px] w-full rounded-xl border border-[rgba(111,131,103,0.16)] bg-white p-3 font-mono text-xs leading-5 text-[#1f271d] outline-none"
        onChange={(event) => setSceneJSON(event.target.value)}
        value={sceneJSON}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="inline-flex min-h-[42px] items-center justify-center rounded-full bg-button-accent px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending}
          onClick={saveScene}
          type="button"
        >
          {isPending ? "Salvando..." : "Salvar cena"}
        </button>
        {message ? <p className="text-sm text-[#566350]">{message}</p> : null}
      </div>
    </section>
  );
}
