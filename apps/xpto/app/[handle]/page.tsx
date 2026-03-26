import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Script from "next/script";

import { prisma } from "@/lib/prisma";
import TrackView from "@/components/TrackView";

const PublicProfileViewer = dynamic(
  () => import("@/components/PublicProfileViewer"),
  { ssr: false },
);

type PageProps = {
  params: {
    handle: string;
  };
};

export async function generateMetadata({ params }: PageProps) {
  const user = await prisma.user.findUnique({
    where: { handle: params.handle },
    select: { name: true, handle: true },
  });

  if (!user) {
    return { title: "Perfil não encontrado" };
  }

  return {
    title: `${user.name ?? user.handle} | XPTO`,
    description: `Perfil de ${user.name ?? user.handle}`,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const user = await prisma.user.findUnique({
    where: { handle: params.handle },
    select: {
      id: true,
      name: true,
      handle: true,
      image: true,
      profiles: {
        where: { status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          id: true,
          name: true,
          scene: {
            select: {
              scene: true,
            },
          },
        },
      },
    },
  });

  if (!user || user.profiles.length === 0) {
    notFound();
  }

  const profile = user.profiles[0];
  const scene = (profile.scene?.scene ?? {}) as {
    elements?: readonly any[];
    appState?: Record<string, unknown>;
    files?: Record<string, unknown>;
  };

  return (
    <>
      <Script id="excalidraw-assets" strategy="beforeInteractive">
        {`window["EXCALIDRAW_ASSET_PATH"] = window.origin;`}
      </Script>
      <TrackView profileId={profile.id} />
      <PublicProfileViewer scene={scene} />
    </>
  );
}
