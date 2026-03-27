import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";

/**
 * Woovi/OpenPix webhook handler.
 * Handles OPENPIX:CHARGE_COMPLETED for both first and recurring payments.
 */
export async function POST(request: Request) {
  const webhookToken = process.env.WOOVI_WEBHOOK_TOKEN;
  if (!webhookToken) {
    console.error("[woovi-webhook] WOOVI_WEBHOOK_TOKEN not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Validate webhook signature
  const signature = request.headers.get("x-webhook-secret");
  if (!signature || !crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(webhookToken),
  )) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = await request.json();
  const event = body.event as string | undefined;

  // We only care about completed charges
  if (event !== "OPENPIX:CHARGE_COMPLETED") {
    return NextResponse.json({ ok: true });
  }

  const charge = body.charge as {
    correlationID?: string;
    value?: number;
    status?: string;
    subscription?: { globalID?: string };
  } | undefined;

  const correlationID = charge?.correlationID;
  if (!correlationID) {
    console.warn("[woovi-webhook] CHARGE_COMPLETED without correlationID");
    return NextResponse.json({ ok: true });
  }

  // Try to find subscription by correlationID (first charge / yearly one-off)
  let sub = await prisma.subscription.findUnique({
    where: { wooviCorrelationId: correlationID },
    select: { id: true, userId: true, status: true, planInterval: true },
  });

  // If not found, try matching by wooviSubscriptionId (subsequent recurring charges)
  if (!sub && charge?.subscription?.globalID) {
    sub = await prisma.subscription.findUnique({
      where: { wooviSubscriptionId: charge.subscription.globalID },
      select: { id: true, userId: true, status: true, planInterval: true },
    });
  }

  if (!sub) {
    console.warn(`[woovi-webhook] No subscription for correlationID=${correlationID}`);
    return NextResponse.json({ ok: true });
  }

  const now = new Date();
  const periodEnd = new Date(now);
  const daysMatch = sub.planInterval.match(/^(\d+)days$/);
  if (daysMatch) {
    periodEnd.setDate(periodEnd.getDate() + parseInt(daysMatch[1], 10));
  } else if (sub.planInterval === "yearly") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  if (sub.status === "PENDING") {
    // First payment — activate subscription + upgrade user to PRO
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      }),
      prisma.user.update({
        where: { id: sub.userId },
        data: { plan: "PRO" },
      }),
    ]);

    console.log(`[woovi-webhook] Subscription ${sub.id} activated for user ${sub.userId}`);
  } else if (sub.status === "ACTIVE") {
    // Recurring payment — extend period
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    console.log(`[woovi-webhook] Subscription ${sub.id} renewed until ${periodEnd.toISOString()}`);
  }

  return NextResponse.json({ ok: true });
}
