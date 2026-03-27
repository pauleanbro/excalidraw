import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/dashboard/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, handle: true, plan: true, image: true },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <div className="px-5 py-8 lg:px-10 lg:py-10">
      <div className="mb-8">
        <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#8a8f83]">
          Conta
        </p>
        <h1 className="mt-1 font-display text-[1.6rem] font-semibold tracking-[-0.03em] text-[#20261f]">
          Configurações
        </h1>
      </div>

      <SettingsForm
        initialName={user.name ?? ""}
        initialHandle={user.handle ?? ""}
        plan={user.plan}
        avatarUrl={user.image ?? undefined}
      />
    </div>
  );
}
