"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AnalyticsData = {
  totalViews: number;
  todayViews: number;
  // PRO fields
  heatmap: { date: string; count: number }[] | null;
  recentViewers: {
    id: string;
    name: string | null;
    image: string | null;
    handle: string | null;
    viewedAt: Date;
  }[] | null;
};

export async function getAnalytics(): Promise<AnalyticsData | null> {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      plan: true,
      profiles: {
        where: { status: "ACTIVE" },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user || user.profiles.length === 0) {
    return {
      totalViews: 0,
      todayViews: 0,
      heatmap: null,
      recentViewers: null,
    };
  }

  const profileIds = user.profiles.map((p) => p.id);
  const isPro = user.plan === "PRO";

  // --- FREE metrics ---
  const totalViews = await prisma.profileView.count({
    where: { profileId: { in: profileIds } },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayViews = await prisma.profileView.count({
    where: {
      profileId: { in: profileIds },
      createdAt: { gte: todayStart },
    },
  });

  if (!isPro) {
    return { totalViews, todayViews, heatmap: null, recentViewers: null };
  }

  // --- PRO metrics ---

  // Heatmap: last 30 days, grouped by date
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const heatmapRaw = await prisma.$queryRaw<
    { date: string; count: bigint }[]
  >`
    SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
    FROM "ProfileView"
    WHERE "profileId" = ANY(${profileIds})
      AND "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  const heatmap = heatmapRaw.map((row) => ({
    date: String(row.date).slice(0, 10),
    count: Number(row.count),
  }));

  // Recent viewers (registered users who viewed)
  const recentViewers = await prisma.profileView.findMany({
    where: {
      profileId: { in: profileIds },
      viewerId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    distinct: ["viewerId"],
    select: {
      createdAt: true,
      viewer: {
        select: {
          id: true,
          name: true,
          image: true,
          handle: true,
        },
      },
    },
  });

  return {
    totalViews,
    todayViews,
    heatmap,
    recentViewers: recentViewers
      .filter((v) => v.viewer !== null)
      .map((v) => ({
        id: v.viewer!.id,
        name: v.viewer!.name,
        image: v.viewer!.image,
        handle: v.viewer!.handle,
        viewedAt: v.createdAt,
      })),
  };
}
