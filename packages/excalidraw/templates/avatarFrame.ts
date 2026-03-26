import { randomId, FONT_FAMILY, ROUNDNESS, MIME_TYPES } from "@excalidraw/common";

import { newElement, newImageElement, newTextElement } from "@excalidraw/element";

import type { ExcalidrawElement, FileId } from "@excalidraw/element/types";
import type { BinaryFileData } from "../types";
import type { TemplateResult } from "./types";

// Card dimensions
const CARD_W = 200;
const CARD_H = 240;
const CARD_RADIUS = 16;
const CARD_BG = "#ffffff";
const CARD_BORDER = "#e0ddd5";

// Avatar
const AVATAR_SIZE = 90;
const AVATAR_Y_OFFSET = 28;

// Name
const NAME_FONT_SIZE = 18;
const NAME_Y_BELOW_AVATAR = 16;

// Badge
const BADGE_SIZE = 18;
const BADGE_GAP = 4;

/**
 * Fetches an image URL and returns a base64 data URL.
 */
const fetchImageAsDataURL = async (
  url: string,
): Promise<{ dataURL: string; mimeType: string } | null> => {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      return null;
    }
    const blob = await resp.blob();
    const mimeType = blob.type || MIME_TYPES.png;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ dataURL: reader.result as string, mimeType });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Creates an "Avatar Frame" template: a card with avatar image,
 * user name, and verification badge. All elements are grouped
 * so they resize proportionally together.
 */
export const createAvatarFrameTemplate = async (opts: {
  userName: string;
  userAvatarUrl?: string;
  badgeUrl: string;
}): Promise<TemplateResult> => {
  const groupId = randomId();
  const elements: ExcalidrawElement[] = [];
  const files: BinaryFileData[] = [];

  // ── 1. Card background ────────────────────────────────────
  const cardElement = newElement({
    type: "rectangle",
    x: 0,
    y: 0,
    width: CARD_W,
    height: CARD_H,
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

  // ── 2. Avatar image (or placeholder) ──────────────────────
  const avatarX = (CARD_W - AVATAR_SIZE) / 2;
  const avatarY = AVATAR_Y_OFFSET;
  const avatarFileId = `tpl-avatar-${randomId()}` as FileId;

  let avatarReady = false;
  if (opts.userAvatarUrl) {
    const imgData = await fetchImageAsDataURL(opts.userAvatarUrl);
    if (imgData) {
      files.push({
        id: avatarFileId,
        dataURL: imgData.dataURL as BinaryFileData["dataURL"],
        mimeType: imgData.mimeType as BinaryFileData["mimeType"],
        created: Date.now(),
        lastRetrieved: Date.now(),
      });
      avatarReady = true;
    }
  }

  if (avatarReady) {
    const avatarElement = newImageElement({
      type: "image",
      x: avatarX,
      y: avatarY,
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      strokeColor: "transparent",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 0,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
      groupIds: [groupId],
      locked: false,
      customData: { premium: true },
      status: "saved",
      fileId: avatarFileId,
    });
    elements.push(avatarElement);
  } else {
    // placeholder circle
    const placeholderElement = newElement({
      type: "ellipse",
      x: avatarX,
      y: avatarY,
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      strokeColor: CARD_BORDER,
      backgroundColor: "#f0ece4",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      roundness: null,
      groupIds: [groupId],
      locked: false,
      customData: { premium: true },
    });
    elements.push(placeholderElement);
  }

  // ── 3. User name text ─────────────────────────────────────
  const nameText = opts.userName || "Seu Nome";
  const nameElement = newTextElement({
    text: nameText,
    x: CARD_W / 2 - (BADGE_SIZE + BADGE_GAP) / 2,
    y: avatarY + AVATAR_SIZE + NAME_Y_BELOW_AVATAR,
    fontSize: NAME_FONT_SIZE,
    fontFamily: FONT_FAMILY.Nunito,
    textAlign: "center",
    strokeColor: "#2f3b2c",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    roundness: null,
    groupIds: [groupId],
    locked: false,
    customData: { premium: true },
  });
  elements.push(nameElement);

  // ── 4. Verification badge ─────────────────────────────────
  const badgeFileId = `tpl-badge-${randomId()}` as FileId;
  const badgeData = await fetchImageAsDataURL(opts.badgeUrl);

  if (badgeData) {
    files.push({
      id: badgeFileId,
      dataURL: badgeData.dataURL as BinaryFileData["dataURL"],
      mimeType: badgeData.mimeType as BinaryFileData["mimeType"],
      created: Date.now(),
      lastRetrieved: Date.now(),
    });

    // Position badge right after the name text
    const badgeX = nameElement.x + nameElement.width + BADGE_GAP;
    const badgeY =
      nameElement.y + (nameElement.height - BADGE_SIZE) / 2;

    const badgeElement = newImageElement({
      type: "image",
      x: badgeX,
      y: badgeY,
      width: BADGE_SIZE,
      height: BADGE_SIZE,
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
      customData: { premium: true },
      status: "saved",
      fileId: badgeFileId,
    });
    elements.push(badgeElement);
  }

  return { elements, files };
};
