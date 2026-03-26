import { redirect } from "next/navigation";
import Script from "next/script";

import { auth } from "@/auth";
import { BRAND } from "@/config/brand";
import { prisma } from "@/lib/prisma";
import EditorShell from "@/components/EditorShell";

type EditorPageProps = {
  params: {
    profileId: string;
  };
};

const buildInitialScene = () => ({
  type: "excalidraw",
  version: 2,
  source: `${BRAND.domain}/dashboard`,
  elements: [],
  appState: {
    viewBackgroundColor: "#f7f5f1",
  },
  files: {},
});

export default async function ProfileEditorPage({ params }: EditorPageProps) {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    redirect("/");
  }

  const profile = await prisma.profile.findFirst({
    where: {
      id: params.profileId,
      user: {
        email: userEmail,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      updatedAt: true,
      user: {
        select: {
          handle: true,
          name: true,
          image: true,
          plan: true,
        },
      },
      scene: {
        select: {
          scene: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!profile) {
    redirect("/dashboard");
  }

  const scenePayload = (profile.scene?.scene ?? buildInitialScene()) as {
    elements?: readonly any[];
    appState?: Record<string, unknown>;
    files?: Record<string, unknown>;
  };

  return (
    <>
      <Script id="excalidraw-assets" strategy="beforeInteractive">
        {`window["EXCALIDRAW_ASSET_PATH"] = window.origin;`}
      </Script>
      <EditorShell
        profileId={profile.id}
        profileName={profile.name}
        profileStatus={profile.status}
        userHandle={profile.user.handle ?? null}
        userName={profile.user.name ?? undefined}
        userAvatarUrl={profile.user.image ?? undefined}
        allowTemplates={profile.user.plan === "PRO"}
        unsplashAccessKey={process.env.UNSPLASH_ACCESS_KEY}
        initialScene={scenePayload}
      />
    </>
  );
}
