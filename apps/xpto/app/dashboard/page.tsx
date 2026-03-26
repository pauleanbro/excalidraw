import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BRAND } from "@/config/brand";
import { prisma } from "@/lib/prisma";
import {
  activateProfileAction,
  createProfileAction,
  signOutAction,
} from "@/actions/dashboard";
import {
  ActiveProfileBanner,
  CreateProfileButton,
  DashboardHeader,
} from "@/components/dashboard/DashboardWidgets";
import ProfileCard from "@/components/dashboard/ProfileCard";
import RoadmapPanel from "@/components/dashboard/RoadmapPanel";
import StatsCard from "@/components/dashboard/StatsCard";
import Link from "next/link";

function normalizeHandle(rawHandle?: string) {
  const candidate = rawHandle?.trim().toLowerCase() ?? "";
  if (!candidate) {
    return null;
  }

  if (!/^[a-z0-9_-]{3,30}$/.test(candidate)) {
    return null;
  }

  return candidate;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function makeUniqueSlug(base: string, takenSlugs: Set<string>) {
  const RESERVED_SLUGS = new Set(["admin", "support", "studio", "api"]);
  const root = base || "perfil";
  let attempt = root;
  let index = 2;

  while (takenSlugs.has(attempt) || RESERVED_SLUGS.has(attempt)) {
    attempt = `${root}-${index}`;
    index += 1;
  }

  return attempt;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

type DashboardPageProps = {
  searchParams?: {
    handle?: string;
  };
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    redirect("/");
  }

  const pendingHandle = normalizeHandle(searchParams?.handle);

  if (pendingHandle) {
    try {
      await prisma.user.updateMany({
        where: { email: userEmail, handle: null },
        data: { handle: pendingHandle },
      });
    } catch {
      // Ignore handle collision
    }
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      handle: true,
      plan: true,
      profiles: {
        orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          updatedAt: true,
          scene: {
            select: {
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!dbUser) {
    redirect("/");
  }

  if (dbUser.profiles.length === 0) {
    const initialSlug = makeUniqueSlug(
      slugify(dbUser.handle || "perfil-1"),
      new Set(),
    );

    await prisma.profile.create({
      data: {
        userId: dbUser.id,
        name: dbUser.handle ? "Perfil principal" : "Meu primeiro perfil",
        slug: initialSlug,
        status: dbUser.handle ? "ACTIVE" : "DRAFT",
      },
    });

    redirect("/dashboard");
  }

  const isPro = dbUser.plan === "PRO";
  const canCreateProfile = isPro || dbUser.profiles.length < 1;

  const activeProfile =
    dbUser.profiles.find((p) => p.status === "ACTIVE") ?? null;
  const draftCount = dbUser.profiles.filter(
    (p) => p.status === "DRAFT",
  ).length;
  const firstName = dbUser.name?.split(" ")[0] ?? "Criador";

  // View count for stats card
  const profileIds = dbUser.profiles.map((p) => p.id);
  const totalViews = await prisma.profileView.count({
    where: { profileId: { in: profileIds } },
  });

  return (
    <div className="px-5 py-8 lg:px-10 lg:py-10">
      {/* Top bar */}
      <DashboardHeader
        domain={BRAND.domain}
        firstName={firstName}
        handle={dbUser.handle}
        hasActiveProfile={!!activeProfile}
        isPro={isPro}
        signOutAction={signOutAction}
      />

      {/* Stats row */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          accent="green"
          detail={activeProfile ? `"${activeProfile.name}" ativo` : "Nenhum ativo"}
          label="Perfis"
          value={dbUser.profiles.length}
        />
        <StatsCard
          accent="purple"
          detail="Pendentes de publicação"
          label="Rascunhos"
          value={draftCount}
        />
        <StatsCard
          accent="amber"
          detail={
            dbUser.handle
              ? `${BRAND.domain}/${dbUser.handle}`
              : "Não definido"
          }
          label="Handle"
          value={dbUser.handle ?? "—"}
        />
        <StatsCard
          accent="blue"
          detail={<Link href="/dashboard/analytics" className="underline hover:text-[#6094c4]">Ver analytics</Link>}
          label="Visualizações"
          value={totalViews}
        />
      </div>

      {/* Active profile banner */}
      {activeProfile && dbUser.handle && (
        <ActiveProfileBanner
          domain={BRAND.domain}
          handle={dbUser.handle}
          profileName={activeProfile.name}
        />
      )}

      {/* Profiles section */}
      <section className="mb-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
              Workspace
            </p>
            <h2 className="mt-1 font-display text-[1.3rem] font-semibold tracking-[-0.03em] text-[#20261f]">
              Seus perfis
            </h2>
          </div>

          <CreateProfileButton
            createAction={createProfileAction}
            disabled={!canCreateProfile}
          />
        </div>

        <div className="grid gap-3">
          {dbUser.profiles.map((profile) => (
            <ProfileCard
              activateAction={activateProfileAction}
              dateFormatter={dateFormatter}
              domain={BRAND.domain}
              handle={dbUser.handle}
              key={profile.id}
              profile={profile}
            />
          ))}
        </div>
      </section>

      {/* Roadmap / upcoming features */}
      <RoadmapPanel />
    </div>
  );
}
