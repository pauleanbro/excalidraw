import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const correlationID = searchParams.get("correlationID");

  if (!correlationID) {
    return NextResponse.json({ error: "Missing correlationID" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { wooviCorrelationId: correlationID },
    select: { id: true, status: true, userId: true, user: { select: { email: true } } },
  });

  if (!sub || sub.user.email !== session.user.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ status: sub.status });
}
