import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAnalytics } from "@/actions/analytics";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { plan: true },
  });

  if (!user) {
    redirect("/");
  }

  const data = await getAnalytics();
  const isPro = user.plan === "PRO";

  return (
    <div className="px-5 py-8 lg:px-10 lg:py-10">
      <div className="mb-8">
        <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
          Métricas
        </p>
        <h1 className="mt-1 font-display text-[1.6rem] font-semibold tracking-[-0.03em] text-[#20261f]">
          Analytics
        </h1>
      </div>

      <AnalyticsDashboard data={data} isPro={isPro} />
    </div>
  );
}
