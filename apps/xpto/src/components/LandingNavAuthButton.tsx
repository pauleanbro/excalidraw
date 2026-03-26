"use client";

import { signIn } from "next-auth/react";

type LandingNavAuthButtonProps = {
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
};

export default function LandingNavAuthButton({
  user,
}: LandingNavAuthButtonProps) {
  if (user) {
    return (
      <a
        href="/dashboard"
        className="inline-flex min-h-[46px] items-center justify-center gap-[0.65rem] rounded-full border border-[rgba(104,126,96,0.14)] bg-[rgba(255,255,255,0.72)] px-[1.1rem] text-[0.95rem] font-bold text-text-strong shadow-[0_10px_26px_rgba(103,94,72,0.08)] transition-all duration-200 hover:-translate-y-px"
      >
        <span
          className="h-7 w-7 shrink-0 rounded-full bg-[linear-gradient(135deg,#5d7358_0%,#95ad8c_100%)] bg-cover bg-center"
          style={
            user.image
              ? {
                  backgroundImage: `url(${user.image})`,
                }
              : undefined
          }
        />
        <span>{user.name ?? "Dashboard"}</span>
      </a>
    );
  }

  return (
    <button
      className="inline-flex min-h-[46px] items-center justify-center gap-[0.65rem] rounded-full bg-button-accent px-[1.1rem] text-[0.95rem] font-bold text-white shadow-button transition-all duration-200 hover:-translate-y-px"
      onClick={() => void signIn("google", { callbackUrl: "/dashboard" })}
      type="button"
    >
      Entrar
    </button>
  );
}
