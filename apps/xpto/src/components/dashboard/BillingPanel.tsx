"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Crown,
  Infinity,
  Layers,
  Loader2,
  Palette,
  BarChart3,
  Link2,
} from "lucide-react";

import { SUBSCRIPTION_PLANS, ONEOFF_PLANS } from "@/config/plans";

import type { PlanInterval, SubscriptionPlanKey, OneoffPlanKey } from "@/config/plans";

type BillingPanelProps = {
  plan: string;
  activeSub: {
    planInterval: string;
    amountCents: number;
    currentPeriodEnd: string | null;
  } | null;
};

const PRO_FEATURES = [
  { icon: Layers, text: "Perfis ilimitados" },
  { icon: Link2, text: "Handle personalizado" },
  { icon: Infinity, text: "Elementos ilimitados" },
  { icon: Palette, text: "Templates premium" },
  { icon: BarChart3, text: "Analytics avançado" },
] as const;

type CheckoutState =
  | { step: "idle" }
  | { step: "loading" }
  | { step: "qrcode"; brCode: string; qrCodeImage: string; paymentLinkUrl: string; correlationID: string }
  | { step: "paid" }
  | { step: "error"; message: string };

export default function BillingPanel({ plan, activeSub }: BillingPanelProps) {
  const isPro = plan === "PRO";
  const [subInterval, setSubInterval] = useState<SubscriptionPlanKey>("monthly");
  const [oneoffKey, setOneoffKey] = useState<OneoffPlanKey | null>(null);
  const [checkout, setCheckout] = useState<CheckoutState>({ step: "idle" });
  const pollRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null);

  const selectedPlanKey: PlanInterval = oneoffKey ?? subInterval;

  useEffect(() => {
    if (checkout.step !== "qrcode") {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const { correlationID } = checkout;

    pollRef.current = globalThis.setInterval(async () => {
      try {
        const res = await fetch(
          `/api/billing/status?correlationID=${encodeURIComponent(correlationID)}`,
        );
        const data = await res.json();

        if (data.status === "ACTIVE") {
          if (pollRef.current) clearInterval(pollRef.current);
          setCheckout({ step: "paid" });
          globalThis.setTimeout(() => globalThis.location.reload(), 1500);
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkout]);

  const handleSubscribe = useCallback(async () => {
    setCheckout({ step: "loading" });

    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: selectedPlanKey }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCheckout({ step: "error", message: data.error ?? "Erro ao criar cobrança." });
        return;
      }

      const data = await res.json();
      setCheckout({
        step: "qrcode",
        brCode: data.brCode,
        qrCodeImage: data.qrCodeImage,
        paymentLinkUrl: data.paymentLinkUrl,
        correlationID: data.correlationID,
      });
    } catch {
      setCheckout({ step: "error", message: "Erro de conexão." });
    }
  }, [selectedPlanKey]);

  const copyBrCode = useCallback(() => {
    if (checkout.step === "qrcode") {
      navigator.clipboard.writeText(checkout.brCode);
    }
  }, [checkout]);

  // ── Active PRO ────────────────────────────────────────────
  if (isPro && activeSub) {
    const periodEnd = activeSub.currentPeriodEnd
      ? new Date(activeSub.currentPeriodEnd).toLocaleDateString("pt-BR")
      : "—";

    const intervalLabel = activeSub.planInterval === "yearly"
      ? "Anual"
      : activeSub.planInterval === "monthly"
        ? "Mensal"
        : activeSub.planInterval.replace(/(\d+)days/, "$1 dias");

    const price = (activeSub.amountCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Plan details */}
        <div className="rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-6 shadow-chip lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#c4a262] to-[#d4b76a] px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-white">
              <Crown className="h-2.5 w-2.5" />
              PRO
            </span>
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-emerald-600">
              Ativo
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
                Plano
              </p>
              <p className="text-[0.88rem] font-medium text-[#20261f]">
                PRO {intervalLabel}
              </p>
            </div>
            <div className="h-px bg-[rgba(111,131,103,0.08)]" />
            <div className="flex items-baseline justify-between">
              <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
                Valor
              </p>
              <p className="text-[0.88rem] font-medium text-[#20261f]">
                {price}
              </p>
            </div>
            <div className="h-px bg-[rgba(111,131,103,0.08)]" />
            <div className="flex items-baseline justify-between">
              <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
                {activeSub.planInterval === "monthly" ? "Próxima cobrança" : "Expira em"}
              </p>
              <p className="text-[0.88rem] font-medium text-[#20261f]">
                {periodEnd}
              </p>
            </div>
          </div>
        </div>

        {/* Features sidebar */}
        <div className="rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-6 shadow-chip">
          <h3 className="mb-3 text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
            Incluído
          </h3>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2.5 text-[0.84rem] text-[#20261f]"
              >
                <Icon className="h-4 w-4 text-[#6b8364]" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ── QR Code ───────────────────────────────────────────────
  if (checkout.step === "qrcode") {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-6 shadow-chip lg:col-span-2">
          <p className="mb-1 text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
            Pagamento
          </p>
          <p className="mb-5 text-[0.88rem] font-medium text-[#20261f]">
            Escaneie o QR Code com seu app de banco.
          </p>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-[14px] border border-[rgba(111,131,103,0.1)] bg-white p-3">
              <img
                src={checkout.qrCodeImage}
                alt="QR Code Pix"
                width={180}
                height={180}
                className="rounded-lg"
              />
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <button
                type="button"
                onClick={copyBrCode}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(111,131,103,0.14)] bg-[rgba(255,255,255,0.84)] px-5 py-2.5 text-[0.82rem] font-semibold text-[#3d5236] shadow-chip transition-all hover:-translate-y-px hover:shadow-md"
              >
                Copiar código Pix
              </button>

              <div className="flex items-center gap-2 text-[0.78rem] text-[#8a8f83]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Aguardando pagamento…
              </div>

              <button
                type="button"
                onClick={() => setCheckout({ step: "idle" })}
                className="text-left text-[0.78rem] text-[#8a8f83] underline underline-offset-2 hover:text-[#6d8a66]"
              >
                Cancelar e voltar
              </button>
            </div>
          </div>
        </div>

        {/* Features sidebar */}
        <div className="rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-6 shadow-chip">
          <h3 className="mb-3 text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
            Você vai desbloquear
          </h3>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2.5 text-[0.84rem] text-[#20261f]"
              >
                <Icon className="h-4 w-4 text-[#6b8364]" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ── Paid ──────────────────────────────────────────────────
  if (checkout.step === "paid") {
    return (
      <div className="rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-6 shadow-chip">
        <div className="flex items-center gap-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
            <Check className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[0.95rem] font-semibold text-[#20261f]">
              Pagamento confirmado
            </p>
            <p className="text-[0.82rem] text-[#8a8f83]">
              Plano PRO ativado. Recarregando…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Plan selection (FREE) ─────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Main grid: plans + features sidebar */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Subscription plans */}
        <div className="rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-6 shadow-chip lg:col-span-2">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
              Plano
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#c4a262] to-[#d4b76a] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-white">
              <Crown className="h-2.5 w-2.5" />
              PRO
            </span>
          </div>
          <p className="mb-5 text-[0.82rem] text-[#8a8f83]">
            Desbloqueie todos os recursos com uma assinatura.
          </p>

          <div className="mb-5 flex gap-3">
            {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanKey[]).map((key) => {
              const p = SUBSCRIPTION_PLANS[key];
              const isSelected = oneoffKey === null && subInterval === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSubInterval(key);
                    setOneoffKey(null);
                    setCheckout({ step: "idle" });
                  }}
                  className={[
                    "relative flex-1 rounded-[14px] border p-4 text-left transition-all",
                    isSelected
                      ? "border-[#6b8364] bg-[rgba(107,131,100,0.04)]"
                      : "border-[rgba(111,131,103,0.12)] hover:border-[rgba(111,131,103,0.25)]",
                  ].join(" ")}
                >
                  {p.badge && (
                    <span className="absolute -top-2 right-3 rounded-full bg-gradient-to-r from-[#c4a262] to-[#d4b76a] px-2 py-px text-[0.58rem] font-bold uppercase tracking-[0.06em] text-white">
                      {p.badge}
                    </span>
                  )}
                  <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#8a8f83]">
                    {p.label}
                  </p>
                  <p className="mt-1 text-[1.3rem] font-bold tracking-tight text-[#20261f]">
                    {p.perMonth}
                    <span className="text-[0.75rem] font-normal text-[#8a8f83]">
                      /mês
                    </span>
                  </p>
                  {key === "yearly" && (
                    <p className="mt-0.5 text-[0.72rem] text-[#8a8f83]">
                      {p.priceDisplay} cobrado por ano
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {oneoffKey === null && (
            <>
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={checkout.step === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-button-accent px-5 py-3 text-[0.88rem] font-semibold text-[#eff5ea] shadow-button transition-all hover:-translate-y-px hover:shadow-lg disabled:opacity-60"
              >
                {checkout.step === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Assinar por {SUBSCRIPTION_PLANS[subInterval].priceDisplay}
                    <span className="text-[0.75rem] font-normal opacity-80">
                      /{SUBSCRIPTION_PLANS[subInterval].interval}
                    </span>
                  </>
                )}
              </button>

              {checkout.step === "error" && (
                <p className="mt-2 text-[0.78rem] text-red-500">
                  {checkout.message}
                </p>
              )}

              <p className="mt-2.5 text-[0.72rem] text-[#b0b5ab]">
                {subInterval === "monthly"
                  ? "Pix recorrente · Cancele quando quiser"
                  : "Pagamento único · Acesso por 1 ano"}
              </p>
            </>
          )}
        </div>

        {/* Features sidebar */}
        <div className="rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-6 shadow-chip">
          <h3 className="mb-3 text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
            O que está incluído
          </h3>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2.5 text-[0.84rem] text-[#20261f]"
              >
                <Icon className="h-4 w-4 text-[#6b8364]" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* One-off passes */}
      <div className="rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-6 shadow-chip">
        <p className="mb-1 text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
          Passes avulsos
        </p>
        <p className="mb-5 text-[0.82rem] text-[#8a8f83]">
          Acesso temporário ao PRO. Ideal para projetos pontuais.
        </p>

        <div className="grid grid-cols-4 gap-2 lg:grid-cols-4">
          {(Object.keys(ONEOFF_PLANS) as OneoffPlanKey[]).map((key) => {
            const p = ONEOFF_PLANS[key];
            const isSelected = oneoffKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setOneoffKey(key);
                  setCheckout({ step: "idle" });
                }}
                className={[
                  "rounded-[12px] border py-3 text-center transition-all",
                  isSelected
                    ? "border-[#6b8364] bg-[rgba(107,131,100,0.04)]"
                    : "border-[rgba(111,131,103,0.12)] hover:border-[rgba(111,131,103,0.25)]",
                ].join(" ")}
              >
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#8a8f83]">
                  {p.days}d
                </p>
                <p className="mt-0.5 text-[1rem] font-bold tracking-tight text-[#20261f]">
                  {p.priceDisplay}
                </p>
              </button>
            );
          })}
        </div>

        {oneoffKey !== null && (
          <div className="mt-5">
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={checkout.step === "loading"}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-button-accent px-6 py-3 text-[0.88rem] font-semibold text-[#eff5ea] shadow-button transition-all hover:-translate-y-px hover:shadow-lg disabled:opacity-60"
            >
              {checkout.step === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Comprar {ONEOFF_PLANS[oneoffKey].days} dias por{" "}
                  {ONEOFF_PLANS[oneoffKey].priceDisplay}
                </>
              )}
            </button>

            {checkout.step === "error" && (
              <p className="mt-2 text-[0.78rem] text-red-500">
                {checkout.message}
              </p>
            )}

            <p className="mt-2 text-[0.72rem] text-[#b0b5ab]">
              Pagamento único via Pix · Ativação instantânea
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
