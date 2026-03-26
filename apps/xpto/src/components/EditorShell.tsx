"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { BRAND } from "@/config/brand";
import FullscreenToggle from "@/components/FullscreenToggle";

const ExcalidrawEditor = dynamic(
  () => import("@/components/ExcalidrawEditor"),
  { ssr: false },
);

type EditorShellProps = {
  profileId: string;
  profileName: string;
  profileStatus: string;
  userHandle: string | null;
  userName?: string;
  userAvatarUrl?: string;
  allowTemplates: boolean;
  unsplashAccessKey?: string;
  initialScene: {
    elements?: readonly any[];
    appState?: Record<string, unknown>;
    files?: Record<string, unknown>;
  };
};

export default function EditorShell({
  profileId,
  profileName,
  profileStatus,
  userHandle,
  userName,
  userAvatarUrl,
  allowTemplates,
  unsplashAccessKey,
  initialScene,
}: EditorShellProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const toggle = useCallback(() => setFullscreen((f) => !f), []);

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[9999] bg-[#f7f5f1]"
          : "flex h-screen flex-col bg-[#f7f5f1]"
      }
    >
      {fullscreen ? null : (
        <header className="flex items-center justify-between border-b border-[rgba(111,131,103,0.12)] bg-[rgba(255,255,255,0.84)] px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              className="inline-flex h-8 items-center justify-center rounded-full border border-[rgba(111,131,103,0.18)] bg-[#f4efe6] px-3 text-xs font-semibold text-[#2f3b2c] transition-transform hover:-translate-y-px"
              href="/dashboard"
            >
              ← Dashboard
            </Link>
            <span className="text-sm font-semibold text-[#20261f]">
              {profileName}
            </span>
            <span className="text-xs text-[#5f665a]">
              {profileStatus === "ACTIVE" ? "ativo" : "draft"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-xs text-[#5f665a]">
              {userHandle
                ? `${BRAND.domain}/${userHandle}`
                : "handle pendente"}
            </p>
            <FullscreenToggle isFullscreen={false} onToggle={toggle} />
          </div>
        </header>
      )}

      <main className={fullscreen ? "h-full" : "relative flex-1"}>
        <ExcalidrawEditor
          profileId={profileId}
          initialScene={initialScene}
          templateData={{ userName, userAvatarUrl }}
          allowTemplates={allowTemplates}
          unsplashAccessKey={unsplashAccessKey}
          isFullscreen={fullscreen}
          onToggleFullscreen={toggle}
        />
      </main>
    </div>
  );
}
