import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import BillingPanel from "@/components/dashboard/BillingPanel";

export default async function BillingPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      plan: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          planInterval: true,
          amountCents: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const activeSub = user.subscriptions[0] ?? null;

  return (
    <div className="px-5 py-8 lg:px-10 lg:py-10">
      <div className="mb-8">
        <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
          Pagamentos
        </p>
        <h1 className="mt-1 font-display text-[1.6rem] font-semibold tracking-[-0.03em] text-[#20261f]">
          Assinatura
        </h1>
      </div>

      <BillingPanel
        plan={user.plan}
        activeSub={
          activeSub
            ? {
                planInterval: activeSub.planInterval,
                amountCents: activeSub.amountCents,
                currentPeriodEnd: activeSub.currentPeriodEnd?.toISOString() ?? null,
              }
            : null
        }
      />
    </div>
  );
}
