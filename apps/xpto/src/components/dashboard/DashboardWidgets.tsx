"use client";

import Image from "next/image";
import { ExternalLink, LogOut, Plus, Sparkles } from "lucide-react";

type DashboardHeaderProps = {
  readonly firstName: string;
  readonly handle?: string | null;
  readonly hasActiveProfile: boolean;
  readonly domain: string;
  readonly isPro?: boolean;
  readonly signOutAction: () => Promise<void>;
};

export function DashboardHeader({
  firstName,
  handle,
  hasActiveProfile,
  domain,
  isPro,
  signOutAction,
}: DashboardHeaderProps) {
  return (
    <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#20261f]">
          Olá, {firstName}!
          {isPro && (
            <Image
              src="/images/verificado.png"
              alt="Verificado"
              width={28}
              height={28}
              className="inline-block"
            />
          )}
        </h1>
        <p className="mt-1.5 text-[0.92rem] text-[#8a8f83]">
          Gerencie seus perfis e acompanhe o que está acontecendo.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {handle && hasActiveProfile && (
          <a
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[rgba(111,131,103,0.14)] bg-[rgba(255,255,255,0.84)] px-4 text-[0.85rem] font-semibold text-[#3d5236] shadow-chip transition-transform duration-200 hover:-translate-y-px"
            href={`https://${domain}/${handle}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-[14px] w-[14px]" strokeWidth={2.2} />
            Ver página
          </a>
        )}
        <form action={signOutAction}>
          <button
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[rgba(111,131,103,0.14)] bg-[rgba(255,255,255,0.84)] px-4 text-[0.85rem] font-semibold text-[#697163] shadow-chip transition-transform duration-200 hover:-translate-y-px"
            type="submit"
          >
            <LogOut className="h-[14px] w-[14px]" strokeWidth={2.2} />
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}

type ActiveBannerProps = {
  readonly profileName: string;
  readonly handle: string;
  readonly domain: string;
};

export function ActiveProfileBanner({
  profileName,
  handle,
  domain,
}: ActiveBannerProps) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-5 shadow-card">
      <div className="flex items-center gap-4">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[14px] border border-[rgba(107,131,100,0.14)] bg-[rgba(107,131,100,0.08)]">
          <Sparkles className="h-[18px] w-[18px] text-[#56704f]" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[0.92rem] font-semibold text-[#20261f]">
            {profileName}
          </p>
          <p className="mt-0.5 text-[0.8rem] text-[#6d8a66]">
            Publicado em {domain}/{handle}
          </p>
        </div>
      </div>
      <a
        className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-button-accent px-5 text-[0.85rem] font-bold text-[#eff5ea] shadow-button transition-transform duration-200 hover:-translate-y-px"
        href={`https://${domain}/${handle}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        Visitar
        <ExternalLink className="h-[14px] w-[14px]" strokeWidth={2.2} />
      </a>
    </div>
  );
}

type CreateProfileButtonProps = {
  readonly createAction: () => Promise<void>;
  readonly disabled?: boolean;
};

export function CreateProfileButton({
  createAction,
  disabled,
}: CreateProfileButtonProps) {
  if (disabled) {
    return (
      <span
        className="inline-flex min-h-[42px] cursor-not-allowed items-center gap-2 rounded-full border border-[rgba(111,131,103,0.18)] bg-[#e8e4db] px-5 text-[0.85rem] font-bold text-[#8a8f83]"
        title="Limite do plano Free atingido"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Novo perfil
        <span className="rounded bg-[#2f3b2c] px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider text-white">
          PRO
        </span>
      </span>
    );
  }

  return (
    <form action={createAction}>
      <button
        className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-button-accent px-5 text-[0.85rem] font-bold text-[#eff5ea] shadow-button transition-transform duration-200 hover:-translate-y-px"
        type="submit"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Novo perfil
      </button>
    </form>
  );
}
