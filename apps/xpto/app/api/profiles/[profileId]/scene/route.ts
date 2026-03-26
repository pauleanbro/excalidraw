import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { normalizeExcalidrawScene } from "@/lib/excalidrawScene";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    profileId: string;
  };
};

const getUserEmail = async () => {
  const session = await auth();
  return session?.user?.email ?? null;
};

const assertProfileOwner = async (profileId: string, userEmail: string) => {
  return prisma.profile.findFirst({
    where: {
      id: profileId,
      user: {
        email: userEmail,
      },
    },
    select: {
      id: true,
    },
  });
};

export async function GET(_: Request, { params }: RouteContext) {
  const userEmail = await getUserEmail();
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await assertProfileOwner(params.profileId, userEmail);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const scene = await prisma.profileScene.findUnique({
    where: { profileId: profile.id },
    select: {
      scene: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    scene: scene?.scene ?? null,
    updatedAt: scene?.updatedAt ?? null,
  });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const userEmail = await getUserEmail();
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await assertProfileOwner(params.profileId, userEmail);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const normalizedScene = normalizeExcalidrawScene(body?.scene ?? body);

  if (!normalizedScene) {
    return NextResponse.json({ error: "Invalid scene payload" }, { status: 400 });
  }

  const saved = await prisma.profileScene.upsert({
    where: { profileId: profile.id },
    update: {
      scene: normalizedScene,
    },
    create: {
      profileId: profile.id,
      scene: normalizedScene,
    },
    select: {
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    updatedAt: saved.updatedAt,
  });
}
