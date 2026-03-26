"use client";

import { Eye, TrendingUp, Lock, Users } from "lucide-react";
import Image from "next/image";

import type { AnalyticsData } from "@/actions/analytics";

type Props = {
  data: AnalyticsData | null;
  isPro: boolean;
};

/* ------------------------------------------------------------------ */
/*  Shared card wrapper                                                */
/* ------------------------------------------------------------------ */
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.76)] p-5 shadow-chip ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PRO lock overlay                                                   */
/* ------------------------------------------------------------------ */
function ProLock() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[20px] bg-[rgba(255,253,250,0.85)] backdrop-blur-[6px]">
      <Lock className="h-6 w-6 text-[#8a8f83]" strokeWidth={1.6} />
      <span className="text-xs font-semibold text-[#8a8f83]">
        Disponível no plano PRO
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Heatmap grid (last 30 days)                                        */
/* ------------------------------------------------------------------ */
function Heatmap({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  // Build a map for quick lookup
  const map = new Map(data.map((d) => [d.date, d.count]));

  // Generate last 30 days
  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: map.get(key) ?? 0 });
  }

  const maxCount = Math.max(1, ...days.map((d) => d.count));

  const getColor = (count: number) => {
    if (count === 0) return "bg-[#f0ede6]";
    const ratio = count / maxCount;
    if (ratio < 0.25) return "bg-[#c8dfc3]";
    if (ratio < 0.5) return "bg-[#93c48a]";
    if (ratio < 0.75) return "bg-[#5faa53]";
    return "bg-[#3d7e33]";
  };

  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
  const monthDay = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  });

  return (
    <div>
      <div className="flex flex-wrap gap-[5px]">
        {days.map((d) => (
          <div
            key={d.date}
            className={`h-[18px] w-[18px] rounded-[4px] transition-colors ${getColor(d.count)}`}
            title={`${monthDay.format(new Date(d.date + "T12:00:00"))}: ${d.count} view${d.count !== 1 ? "s" : ""}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[0.65rem] text-[#8a8f83]">
        <span>Menos</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <span
            key={r}
            className={`inline-block h-[12px] w-[12px] rounded-[3px] ${
              r === 0
                ? "bg-[#f0ede6]"
                : r < 0.5
                  ? "bg-[#c8dfc3]"
                  : r < 0.75
                    ? "bg-[#93c48a]"
                    : r < 1
                      ? "bg-[#5faa53]"
                      : "bg-[#3d7e33]"
            }`}
          />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Viewers list (PRO)                                                 */
/* ------------------------------------------------------------------ */
function ViewersList({
  viewers,
}: {
  viewers: NonNullable<AnalyticsData["recentViewers"]>;
}) {
  if (viewers.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[#8a8f83]">
        Nenhum visitante registrado ainda
      </p>
    );
  }

  const timeAgo = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  const formatRelative = (date: Date) => {
    const now = Date.now();
    const diffMs = new Date(date).getTime() - now;
    const diffMin = Math.round(diffMs / 60_000);
    if (Math.abs(diffMin) < 60) return timeAgo.format(diffMin, "minute");
    const diffH = Math.round(diffMs / 3_600_000);
    if (Math.abs(diffH) < 24) return timeAgo.format(diffH, "hour");
    const diffD = Math.round(diffMs / 86_400_000);
    return timeAgo.format(diffD, "day");
  };

  return (
    <ul className="divide-y divide-[rgba(111,131,103,0.08)]">
      {viewers.map((v) => (
        <li key={v.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          {v.image ? (
            <Image
              alt={v.name ?? ""}
              className="h-8 w-8 rounded-full object-cover"
              height={32}
              src={v.image}
              width={32}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eae6dc] text-xs font-bold text-[#6e7669]">
              {(v.name ?? "?")[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#20261f]">
              {v.name ?? "Usuário"}
            </p>
            {v.handle && (
              <p className="truncate text-xs text-[#8a8f83]">@{v.handle}</p>
            )}
          </div>
          <span className="shrink-0 text-[0.7rem] text-[#8a8f83]">
            {formatRelative(v.viewedAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Component                                           */
/* ------------------------------------------------------------------ */
export default function AnalyticsDashboard({ data, isPro }: Props) {
  if (!data) {
    return (
      <p className="py-12 text-center text-sm text-[#8a8f83]">
        Nenhum dado disponível
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Free stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#6094c4]" strokeWidth={2} />
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-[#8a8f83]">
              Total de visualizações
            </p>
          </div>
          <strong className="mt-2 block font-display text-[2rem] font-semibold leading-none tracking-[-0.03em] text-[#20261f]">
            {data.totalViews.toLocaleString("pt-BR")}
          </strong>
          <p className="mt-2 text-[0.78rem] text-[#8a8f83]">
            Desde a criação do perfil
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#6b8364]" strokeWidth={2} />
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-[#8a8f83]">
              Visualizações hoje
            </p>
          </div>
          <strong className="mt-2 block font-display text-[2rem] font-semibold leading-none tracking-[-0.03em] text-[#20261f]">
            {data.todayViews.toLocaleString("pt-BR")}
          </strong>
          <p className="mt-2 text-[0.78rem] text-[#8a8f83]">
            Atualizado em tempo real
          </p>
        </Card>
      </div>

      {/* PRO: Heatmap */}
      <Card className="relative overflow-hidden">
        {!isPro && <ProLock />}
        <div className="mb-4 flex items-center gap-2">
          <span className="h-[7px] w-[7px] rounded-full bg-[#6b8364]" />
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-[#8a8f83]">
            Heatmap — últimos 30 dias
          </p>
          {!isPro && (
            <span className="ml-auto rounded-full bg-[#2f3b2c] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              PRO
            </span>
          )}
        </div>
        {isPro && data.heatmap ? (
          <Heatmap data={data.heatmap} />
        ) : (
          <Heatmap
            data={[
              { date: "2026-03-20", count: 3 },
              { date: "2026-03-22", count: 7 },
              { date: "2026-03-24", count: 2 },
              { date: "2026-03-25", count: 5 },
              { date: "2026-03-26", count: 1 },
            ]}
          />
        )}
      </Card>

      {/* PRO: Visitors */}
      <Card className="relative overflow-hidden">
        {!isPro && <ProLock />}
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-[#8b7bb5]" strokeWidth={2} />
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-[#8a8f83]">
            Visitantes recentes
          </p>
          {!isPro && (
            <span className="ml-auto rounded-full bg-[#2f3b2c] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              PRO
            </span>
          )}
        </div>
        {isPro && data.recentViewers ? (
          <ViewersList viewers={data.recentViewers} />
        ) : (
          <ViewersList
            viewers={[
              {
                id: "demo-1",
                name: "Maria Silva",
                image: null,
                handle: "maria",
                viewedAt: new Date(Date.now() - 3_600_000),
              },
              {
                id: "demo-2",
                name: "João Santos",
                image: null,
                handle: "joao",
                viewedAt: new Date(Date.now() - 86_400_000),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
