import type { UserPlan } from "@prisma/client";

export const isPro = (plan: UserPlan | undefined | null): boolean =>
  plan === "PRO";
