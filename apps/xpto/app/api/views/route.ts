import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const profileId = body?.profileId;

  if (!profileId || typeof profileId !== "string") {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }

  // Verify profile exists
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get viewer info
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;
  const referrer = request.headers.get("referer") ?? null;

  // Dedup: 1 view per visitor per profile per 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existing = await prisma.profileView.findFirst({
    where: {
      profileId,
      createdAt: { gte: since },
      ...(viewerId ? { viewerId } : ip ? { ip, viewerId: null } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ ok: true, deduplicated: true });
  }

  await prisma.profileView.create({
    data: {
      profileId,
      viewerId,
      ip,
      userAgent,
      referrer,
    },
  });

  return NextResponse.json({ ok: true });
}
