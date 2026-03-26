"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "xpto:viewed:";

export default function TrackView({ profileId }: { profileId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const key = STORAGE_KEY + profileId;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {}

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    })
      .then(() => {
        try {
          sessionStorage.setItem(key, "1");
        } catch {}
      })
      .catch(() => {});
  }, [profileId]);

  return null;
}
