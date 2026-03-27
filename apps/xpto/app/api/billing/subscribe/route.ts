import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCharge, createSubscription } from "@/lib/woovi";
import { ALL_PLANS } from "@/config/plans";

import type { PlanInterval } from "@/config/plans";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const interval = body.interval as PlanInterval;

  if (!interval || !ALL_PLANS[interval]) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Check if user already has an active subscription
  if (user.plan === "PRO") {
    const active = await prisma.subscription.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      select: { id: true, currentPeriodEnd: true },
    });

    if (active) {
      return NextResponse.json({
        error: "Você já tem uma assinatura ativa.",
        currentPeriodEnd: active.currentPeriodEnd,
      }, { status: 409 });
    }
  }

  const plan = ALL_PLANS[interval];
  const customerName = user.name ?? "Usuário XPTO";
  const customerEmail = user.email!;

  if (interval === "monthly") {
    // ── Recurring monthly: use Woovi Subscriptions API ──────
    const { subscription, charge } = await createSubscription({
      value: plan.priceCents,
      customer: { name: customerName, email: customerEmail },
    });

    const firstCorrelationID = charge?.correlationID ?? null;

    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: "PENDING",
        planInterval: interval,
        amountCents: plan.priceCents,
        wooviSubscriptionId: subscription.globalID,
        wooviCorrelationId: firstCorrelationID,
        wooviChargeId: firstCorrelationID,
      },
    });

    return NextResponse.json({
      correlationID: firstCorrelationID,
      brCode: charge?.brCode ?? null,
      qrCodeImage: charge?.qrCodeImage ?? null,
      paymentLinkUrl: charge?.paymentLinkUrl ?? null,
    });
  }

  // ── One-off charge: yearly, day passes ────────────────────
  const correlationID = randomUUID();

  const { charge } = await createCharge({
    correlationID,
    valueCents: plan.priceCents,
    comment: `XPTO PRO – ${plan.label}`,
    customer: { name: customerName, email: customerEmail },
    expiresIn: 3600,
  });

  await prisma.subscription.create({
    data: {
      userId: user.id,
      status: "PENDING",
      planInterval: interval,
      amountCents: plan.priceCents,
      wooviChargeId: charge.correlationID,
      wooviCorrelationId: correlationID,
    },
  });

  return NextResponse.json({
    correlationID,
    brCode: charge.brCode,
    qrCodeImage: charge.qrCodeImage,
    paymentLinkUrl: charge.paymentLinkUrl,
  });
}
