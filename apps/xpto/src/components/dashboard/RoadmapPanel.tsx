"use client";

import {
  BarChart3,
  CreditCard,
  Palette,
  ShoppingBag,
} from "lucide-react";

type RoadmapItem = {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ElementType;
  readonly dotColor: string;
};

const ROADMAP: readonly RoadmapItem[] = [
  {
    title: "Loja de itens",
    description:
      "Compre blocos, templates e assets exclusivos para personalizar seus perfis.",
    icon: ShoppingBag,
    dotColor: "bg-[#6b8364]",
  },
  {
    title: "Blocos premium",
    description:
      "Desbloqueie elementos avançados no editor com animações e interações.",
    icon: Palette,
    dotColor: "bg-[#8b7bb5]",
  },
  {
    title: "Analytics detalhado",
    description:
      "Acompanhe visualizações, cliques e engajamento por perfil.",
    icon: BarChart3,
    dotColor: "bg-[#6094c4]",
  },
  {
    title: "Planos e assinaturas",
    description:
      "Escolha o plano ideal para expandir limites e acessar recursos exclusivos.",
    icon: CreditCard,
    dotColor: "bg-[#c4a262]",
  },
] as const;

export default function RoadmapPanel() {
  return (
    <section>
      <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
        Em desenvolvimento
      </p>
      <h3 className="mt-1 font-display text-[1.3rem] font-semibold tracking-[-0.03em] text-[#20261f]">
        O que vem por aí
      </h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {ROADMAP.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-[20px] border border-[rgba(111,131,103,0.1)] bg-[rgba(255,255,255,0.6)] p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[12px] border border-[rgba(111,131,103,0.1)] bg-[rgba(255,255,255,0.8)]">
                  <Icon className="h-[16px] w-[16px] text-[#8a8f83]" strokeWidth={1.8} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-[6px] w-[6px] rounded-full ${item.dotColor}`} />
                  <p className="text-[0.88rem] font-semibold text-[#20261f]">
                    {item.title}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[0.82rem] leading-[1.65] text-[#8a8f83]">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
