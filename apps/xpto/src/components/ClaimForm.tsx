"use client";

import { AnimatePresence, motion } from "motion/react";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { BRAND } from "@/config/brand";

type ClaimFormProps = {
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  isAuthenticated?: boolean;
};

type AvailabilityState =
  | "idle"
  | "invalid"
  | "checking"
  | "available"
  | "unavailable";

const RESERVED_HANDLES = new Set(["admin", "support", "studio", "api"]);

const isHandleFormatValid = (handle: string) => /^[a-z0-9_-]{3,30}$/.test(handle);

export default function ClaimForm({
  className,
  inputClassName,
  buttonClassName,
  isAuthenticated = false,
}: ClaimFormProps) {
  const [value, setValue] = useState("");
  const [availability, setAvailability] = useState<AvailabilityState>("idle");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const trimmed = useMemo(() => value.trim().toLowerCase(), [value]);

  useEffect(() => {
    if (!trimmed) {
      setAvailability("idle");
      return;
    }

    if (!isHandleFormatValid(trimmed)) {
      setAvailability("invalid");
      return;
    }

    if (RESERVED_HANDLES.has(trimmed)) {
      setAvailability("unavailable");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setAvailability("checking");

        const response = await fetch(
          `/api/handles/check?handle=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );

        const payload = (await response.json()) as { available?: boolean };
        setAvailability(payload.available ? "available" : "unavailable");
      } catch {
        if (!controller.signal.aborted) {
          setAvailability("unavailable");
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [trimmed]);

  const callbackUrl = `/dashboard?handle=${encodeURIComponent(trimmed)}`;
  const isHandleValid = availability === "available";

  const feedback = useMemo(() => {
    if (availability === "idle") {
      return {
        text: `Escolha um handle para sua página em ${BRAND.domain}.`,
        className: "text-[#7d8578]",
      };
    }

    if (availability === "invalid") {
      return {
        text: "Use de 3 a 30 caracteres (letras, números, _ ou -).",
        className: "text-[#d8a8a2]",
      };
    }

    if (availability === "checking") {
      return {
        text: `Verificando disponibilidade para ${BRAND.domain}/${trimmed}...`,
        className: "text-[#6d7568]",
      };
    }

    if (availability === "unavailable") {
      return {
        text: `${BRAND.domain}/${trimmed} não está disponível.`,
        className: "text-[#d8a8a2]",
      };
    }

    return {
      text: `${BRAND.domain}/${trimmed} está disponível.`,
      className: "text-[#6c8f60]",
    };
  }, [availability, trimmed]);

  return (
    <div className="relative">
      <form
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          if (!isHandleValid) {
            return;
          }

          if (isAuthenticated) {
            window.location.href = callbackUrl;
            return;
          }

          setIsModalOpen(true);
        }}
      >
        <label className="inline-flex min-w-0 flex-1 items-center px-4">
          <span className="whitespace-nowrap text-[#8b9186]">{BRAND.domain}/</span>
          <input
            className={[
              "min-w-0 flex-1 border-0 bg-transparent pl-[0.15rem] text-[#20261f] outline-none placeholder:text-[#9aa095]",
              inputClassName ?? "",
            ].join(" ")}
            placeholder="seunome"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>

        <button className={buttonClassName} disabled={!isHandleValid} type="submit">
          Reservar handle
        </button>
      </form>

      <p className={`mt-[0.7rem] min-h-[20px] text-[0.92rem] ${feedback.className}`}>
        {feedback.text}
      </p>

      <AnimatePresence>
        {isModalOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(12,16,11,0.48)] p-4 backdrop-blur-[3px]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-[460px] rounded-[28px] border border-[rgba(111,131,103,0.16)] bg-[#fffdf8] p-6 shadow-[0_28px_80px_rgba(97,86,67,0.22)]"
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              onClick={(event) => event.stopPropagation()}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <span className="inline-flex text-[0.75rem] font-extrabold uppercase tracking-[0.14em] text-[#6d8a66]">
                Continuar cadastro
              </span>
              <h2 className="mt-3 font-display text-[clamp(1.8rem,5vw,2.4rem)] leading-[1.04] tracking-[-0.05em] text-[#20261f]">
                Quase lá, {BRAND.domain}/{trimmed}
              </h2>
              <p className="mt-3 leading-[1.7] text-[#5f665a]">
                Entre com Google para salvar seu handle e iniciar sua dashboard.
              </p>

              <button
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-button-accent px-5 font-bold text-white shadow-button transition-transform duration-200 hover:-translate-y-px"
                onClick={() => void signIn("google", { callbackUrl })}
                type="button"
              >
                Continuar com Google
              </button>
              <button
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[rgba(111,131,103,0.16)] bg-[#f8f4ec] px-5 font-bold text-[#2f3b2c] transition-transform duration-200 hover:-translate-y-px"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
