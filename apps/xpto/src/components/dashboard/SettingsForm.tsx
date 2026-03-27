"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Crown, Loader2 } from "lucide-react";

import { BRAND } from "@/config/brand";

type SettingsFormProps = {
  initialName: string;
  initialHandle: string;
  plan: string;
  avatarUrl?: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsForm({
  initialName,
  initialHandle,
  plan,
  avatarUrl,
}: SettingsFormProps) {
  const isPro = plan === "PRO";

  // ── Name state ────────────────────────────────────────────
  const [name, setName] = useState(initialName);
  const [nameStatus, setNameStatus] = useState<SaveStatus>("idle");
  const [nameError, setNameError] = useState("");
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Handle state ──────────────────────────────────────────
  const [handle, setHandle] = useState(initialHandle);
  const [handleStatus, setHandleStatus] = useState<SaveStatus>("idle");
  const [handleError, setHandleError] = useState("");
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const handleCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Persist helpers ───────────────────────────────────────
  const save = useCallback(
    async (
      payload: Record<string, string>,
      setStatus: (s: SaveStatus) => void,
      setError: (e: string) => void,
    ) => {
      setStatus("saving");
      setError("");

      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Erro ao salvar.");
          setStatus("error");
          return;
        }

        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setError("Erro de conexão.");
        setStatus("error");
      }
    },
    [],
  );

  // ── Name save (debounced on blur / enter) ─────────────────
  const saveName = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed === initialName) return;
    if (trimmed.length < 2 || trimmed.length > 60) {
      setNameError("Nome deve ter entre 2 e 60 caracteres.");
      return;
    }
    save({ name: trimmed }, setNameStatus, setNameError);
  }, [name, initialName, save]);

  // ── Handle availability check (debounced) ─────────────────
  useEffect(() => {
    const normalized = handle.trim().toLowerCase();

    if (!normalized || normalized === initialHandle) {
      setHandleAvailable(null);
      setHandleError("");
      return;
    }

    if (!/^[a-z0-9_-]{3,30}$/.test(normalized)) {
      setHandleAvailable(null);
      setHandleError("Use 3-30 caracteres: letras, números, _ ou -");
      return;
    }

    setHandleError("");
    setHandleAvailable(null);

    if (handleCheckTimer.current) clearTimeout(handleCheckTimer.current);

    handleCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/handles/check?handle=${encodeURIComponent(normalized)}`,
        );
        const data = await res.json();
        setHandleAvailable(data.available);
        if (!data.available && data.reason === "taken") {
          setHandleError("Esse handle já está em uso.");
        } else if (!data.available && data.reason === "reserved") {
          setHandleError("Esse handle é reservado.");
        }
      } catch {
        // ignore network errors for check
      }
    }, 400);

    return () => {
      if (handleCheckTimer.current) clearTimeout(handleCheckTimer.current);
    };
  }, [handle, initialHandle]);

  const saveHandle = useCallback(() => {
    const normalized = handle.trim().toLowerCase();
    if (normalized === initialHandle) return;
    if (handleAvailable !== true) return;
    save({ handle: normalized }, setHandleStatus, setHandleError);
  }, [handle, initialHandle, handleAvailable, save]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (nameTimer.current) clearTimeout(nameTimer.current);
      if (handleCheckTimer.current) clearTimeout(handleCheckTimer.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Avatar + Name card ─────────────────────────────── */}
      <div className="rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-6 shadow-chip">
        <div className="mb-5 flex items-center gap-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={56}
              height={56}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0ece4] text-[1.2rem] font-semibold text-[#8a8f83]">
              {name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <p className="text-[0.95rem] font-semibold text-[#20261f]">
              {name || "Sem nome"}
            </p>
            <p className="text-[0.78rem] text-[#8a8f83]">
              Sua foto vem do Google
            </p>
          </div>
        </div>

        <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
          Nome de exibição
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameStatus("idle");
              setNameError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
            }}
            maxLength={60}
            className="flex-1 rounded-[12px] border border-[rgba(111,131,103,0.14)] bg-white px-3.5 py-2.5 text-[0.9rem] text-[#20261f] outline-none transition-shadow focus:ring-2 focus:ring-[rgba(107,131,100,0.2)]"
          />
          <button
            type="button"
            onClick={saveName}
            disabled={nameStatus === "saving" || name.trim() === initialName}
            className="inline-flex h-[42px] items-center justify-center rounded-full border border-[rgba(111,131,103,0.14)] bg-[rgba(255,255,255,0.84)] px-5 text-[0.82rem] font-semibold text-[#3d5236] shadow-chip transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {nameStatus === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : nameStatus === "saved" ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              "Salvar"
            )}
          </button>
        </div>
        {nameError && (
          <p className="mt-2 text-[0.78rem] text-red-500">{nameError}</p>
        )}
      </div>

      {/* ── Handle card ────────────────────────────────────── */}
      <div className="relative rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-6 shadow-chip">
        {/* PRO badge */}
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
            Handle
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#c4a262] to-[#d4b76a] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-white">
            <Crown className="h-2.5 w-2.5" />
            PRO
          </span>
        </div>

        <p className="mb-4 text-[0.82rem] text-[#8a8f83]">
          Seu link público:{" "}
          <span className="font-medium text-[#6d8a66]">
            {BRAND.domain}/{handle || "..."}
          </span>
        </p>

        {isPro ? (
          <>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[0.82rem] text-[#b0b5ab]">
                  {BRAND.domain}/
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => {
                    setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""));
                    setHandleStatus("idle");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveHandle();
                  }}
                  maxLength={30}
                  className="w-full rounded-[12px] border border-[rgba(111,131,103,0.14)] bg-white py-2.5 pl-[calc(0.82rem*7.2)] pr-3.5 text-[0.9rem] text-[#20261f] outline-none transition-shadow focus:ring-2 focus:ring-[rgba(107,131,100,0.2)]"
                />
              </div>
              <button
                type="button"
                onClick={saveHandle}
                disabled={
                  handleStatus === "saving" ||
                  handle.trim().toLowerCase() === initialHandle ||
                  handleAvailable !== true
                }
                className="inline-flex h-[42px] items-center justify-center rounded-full border border-[rgba(111,131,103,0.14)] bg-[rgba(255,255,255,0.84)] px-5 text-[0.82rem] font-semibold text-[#3d5236] shadow-chip transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {handleStatus === "saving" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : handleStatus === "saved" ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  "Salvar"
                )}
              </button>
            </div>

            {/* Availability feedback */}
            {handle.trim() !== initialHandle && handle.trim().length >= 3 && (
              <p
                className={`mt-2 text-[0.78rem] ${
                  handleError
                    ? "text-red-500"
                    : handleAvailable === true
                      ? "text-emerald-600"
                      : "text-[#8a8f83]"
                }`}
              >
                {handleError
                  ? handleError
                  : handleAvailable === true
                    ? "✓ Handle disponível!"
                    : handleAvailable === null
                      ? "Verificando..."
                      : ""}
              </p>
            )}
          </>
        ) : (
          <div className="rounded-[14px] border border-dashed border-[rgba(196,162,98,0.3)] bg-[rgba(196,162,98,0.04)] px-5 py-4 text-center">
            <Crown className="mx-auto mb-2 h-6 w-6 text-[#c4a262]" />
            <p className="text-[0.85rem] font-medium text-[#20261f]">
              Personalize seu handle
            </p>
            <p className="mt-1 text-[0.78rem] text-[#8a8f83]">
              Faça upgrade para o plano PRO para escolher seu link exclusivo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
