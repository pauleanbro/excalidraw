"use client";

import { useCallback } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

type FullscreenToggleProps = {
  isFullscreen: boolean;
  onToggle: () => void;
};

export default function FullscreenToggle({
  isFullscreen,
  onToggle,
}: FullscreenToggleProps) {
  return (
    <button
      aria-label={isFullscreen ? "Sair do fullscreen" : "Fullscreen"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(111,131,103,0.18)] bg-[#f4efe6] text-[#2f3b2c] transition-transform hover:-translate-y-px"
      onClick={onToggle}
      type="button"
    >
      {isFullscreen ? (
        <Minimize2 className="h-[14px] w-[14px]" strokeWidth={2.2} />
      ) : (
        <Maximize2 className="h-[14px] w-[14px]" strokeWidth={2.2} />
      )}
    </button>
  );
}
