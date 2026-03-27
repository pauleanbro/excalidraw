import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const RESERVED_HANDLES = new Set(["admin", "support", "studio", "api"]);

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, handle } = body as { name?: string; handle?: string };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, plan: true, handle: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data: Record<string, string> = {};

  // ── Name validation ─────────────────────────────────────
  if (name !== undefined) {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      return NextResponse.json(
        { error: "Nome deve ter entre 2 e 60 caracteres." },
        { status: 400 },
      );
    }
    data.name = trimmed;
  }

  // ── Handle validation (PRO only) ───────────────────────
  if (handle !== undefined) {
    if (user.plan !== "PRO") {
      return NextResponse.json(
        { error: "Alterar handle é exclusivo do plano PRO." },
        { status: 403 },
      );
    }

    const normalized = handle.trim().toLowerCase();

    if (!/^[a-z0-9_-]{3,30}$/.test(normalized)) {
      return NextResponse.json(
        { error: "Handle inválido. Use 3-30 caracteres: letras, números, _ ou -." },
        { status: 400 },
      );
    }

    if (RESERVED_HANDLES.has(normalized)) {
      return NextResponse.json(
        { error: "Esse handle é reservado." },
        { status: 400 },
      );
    }

    // Check uniqueness (skip if handle unchanged)
    if (normalized !== user.handle) {
      const existing = await prisma.user.findFirst({
        where: { handle: { equals: normalized, mode: "insensitive" } },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Esse handle já está em uso." },
          { status: 409 },
        );
      }
    }

    data.handle = normalized;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { name: true, handle: true },
  });

  return NextResponse.json(updated);
}
