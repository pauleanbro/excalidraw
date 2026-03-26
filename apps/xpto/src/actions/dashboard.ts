"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

const RESERVED_SLUGS = new Set(["admin", "support", "studio", "api"]);

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function makeUniqueSlug(base: string, takenSlugs: Set<string>) {
  const root = base || "perfil";
  let attempt = root;
  let index = 2;

  while (takenSlugs.has(attempt) || RESERVED_SLUGS.has(attempt)) {
    attempt = `${root}-${index}`;
    index += 1;
  }

  return attempt;
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function activateProfileAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  if (!profileId) {
    return;
  }

  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  if (!user) {
    redirect("/");
  }

  await prisma.$transaction(async (tx) => {
    const target = await tx.profile.findFirst({
      where: { id: profileId, userId: user.id },
      select: { id: true },
    });

    if (!target) {
      return;
    }

    await tx.profile.updateMany({
      where: { userId: user.id, status: "ACTIVE" },
      data: { status: "DRAFT" },
    });

    await tx.profile.update({
      where: { id: target.id },
      data: { status: "ACTIVE" },
    });
  });

  revalidatePath("/dashboard");
}

export async function createProfileAction() {
  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      handle: true,
      plan: true,
      profiles: {
        select: {
          slug: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  if (user.plan !== "PRO" && user.profiles.length >= 1) {
    return;
  }

  const profileCount = user.profiles.length + 1;
  const fallbackName = `Perfil ${profileCount}`;
  const takenSlugs = new Set(user.profiles.map((profile) => profile.slug));
  const uniqueSlug = makeUniqueSlug(slugify(fallbackName), takenSlugs);
  const hasActiveProfile = user.profiles.some(
    (profile) => profile.status === "ACTIVE",
  );

  await prisma.profile.create({
    data: {
      userId: user.id,
      name: fallbackName,
      slug: uniqueSlug,
      status: hasActiveProfile && user.handle ? "DRAFT" : "ACTIVE",
    },
  });

  revalidatePath("/dashboard");
}
