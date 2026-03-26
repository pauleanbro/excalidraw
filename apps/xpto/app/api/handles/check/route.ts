import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const RESERVED_HANDLES = new Set(["admin", "support", "studio", "api"]);

const normalizeHandle = (rawHandle: string | null) =>
  rawHandle?.trim().toLowerCase() ?? "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = normalizeHandle(searchParams.get("handle"));

  if (!handle) {
    return NextResponse.json(
      {
        available: false,
        reason: "empty",
      },
      { status: 400 },
    );
  }

  if (!/^[a-z0-9_-]{3,30}$/.test(handle)) {
    return NextResponse.json(
      {
        available: false,
        reason: "invalid",
      },
      { status: 400 },
    );
  }

  if (RESERVED_HANDLES.has(handle)) {
    return NextResponse.json({
      available: false,
      reason: "reserved",
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      handle: {
        equals: handle,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  return NextResponse.json({
    available: !user,
    reason: user ? "taken" : "available",
  });
}
