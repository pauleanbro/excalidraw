import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { randomId, MIME_TYPES, ROUNDNESS, normalizeLink } from "@excalidraw/common";
import { normalizeSVG } from "@excalidraw/element";
import { newElement, newImageElement } from "@excalidraw/element";
import { getDataURL_sync } from "../data/blob";

import type { ExcalidrawElement, FileId } from "@excalidraw/element/types";
import type { BinaryFileData } from "../types";
import type { TemplateResult } from "./types";

// Layout constants
const ROW_PADDING_X = 20;
const ROW_PADDING_Y = 16;
const ICON_SIZE = 40;
const ICON_GAP = 14;
const CARD_RADIUS = 12;
const CARD_BG = "#ffffff";
const CARD_BORDER = "#e0ddd5";
const ICON_RENDER_SIZE = 48; // bigger for SVG quality

export type SocialNetworkEntry = {
  id: string;
  label: string;
  Icon: React.ComponentType<{
    size?: string | number;
    color?: string;
    title?: string;
  }>;
  color?: string;
  /** URL or text value for the social button action */
  value?: string;
  /** Action type: "link" opens a URL, "clipboard" copies text */
  actionType?: "link" | "clipboard";
};

/**
 * Creates a "Social Row" template: a horizontal card with a row of
 * social-media icons, all grouped for proportional resize.
 */
export const createSocialRowTemplate = (opts: {
  networks: SocialNetworkEntry[];
}): TemplateResult => {
  const { networks } = opts;
  if (networks.length === 0) {
    return { elements: [], files: [] };
  }

  const groupId = randomId();
  const elements: ExcalidrawElement[] = [];
  const files: BinaryFileData[] = [];

  const cardW =
    ROW_PADDING_X * 2 + networks.length * ICON_SIZE + (networks.length - 1) * ICON_GAP;
  const cardH = ROW_PADDING_Y * 2 + ICON_SIZE;

  // ── 1. Card background ──────────────────────────────────
  const cardElement = newElement({
    type: "rectangle",
    x: 0,
    y: 0,
    width: cardW,
    height: cardH,
    strokeColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    groupIds: [groupId],
    locked: false,
    customData: { premium: true },
  });
  elements.push(cardElement);

  // ── 2. Icons ────────────────────────────────────────────
  for (let i = 0; i < networks.length; i++) {
    const net = networks[i];
    const iconX = ROW_PADDING_X + i * (ICON_SIZE + ICON_GAP);
    const iconY = ROW_PADDING_Y;

    const fileId = `tpl-social-${net.id}-${randomId()}` as FileId;

    // Render the React icon component to SVG markup
    const svgMarkup = renderToStaticMarkup(
      React.createElement(net.Icon, {
        size: ICON_RENDER_SIZE,
        color: net.color ?? "#333333",
        title: net.label,
      }),
    );

    const svgDataURL = getDataURL_sync(
      normalizeSVG(svgMarkup),
      MIME_TYPES.svg,
    );

    files.push({
      id: fileId,
      dataURL: svgDataURL as BinaryFileData["dataURL"],
      mimeType: MIME_TYPES.svg as BinaryFileData["mimeType"],
      created: Date.now(),
      lastRetrieved: Date.now(),
    });

    const iconElement = newImageElement({
      type: "image",
      x: iconX,
      y: iconY,
      width: ICON_SIZE,
      height: ICON_SIZE,
      strokeColor: "transparent",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 0,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      roundness: null,
      groupIds: [groupId],
      locked: false,
      customData: {
        premium: true,
        ...(net.value
          ? {
              socialButton: {
                network: net.id,
                actionType: net.actionType ?? "link",
                value: net.value,
                color: net.color ?? "#333333",
              },
            }
          : {}),
      },
      link:
        net.value && (net.actionType ?? "link") === "link"
          ? normalizeLink(net.value)
          : null,
      status: "saved",
      fileId,
    });
    elements.push(iconElement);
  }

  return { elements, files };
};
