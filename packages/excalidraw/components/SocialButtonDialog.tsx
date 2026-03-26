import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  SiBehance,
  SiDiscord,
  SiDribbble,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiPatreon,
  SiPinterest,
  SiReddit,
  SiSnapchat,
  SiSoundcloud,
  SiSpotify,
  SiSteam,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons";

import { KEYS } from "@excalidraw/common";

import { t } from "../i18n";
import { useOutsideClick } from "../hooks/useOutsideClick";

import DialogActionButton from "./DialogActionButton";
import { TextField } from "./TextField";
import { Island } from "./Island";
import { CloseIcon } from "./icons";

import "./SocialButtonDialog.scss";

import type { AppClassProperties } from "../types";

type ActionType = "link" | "clipboard";

type IconOption = {
  id: string;
  label: string;
  Icon: React.ComponentType<{
    size?: string | number;
    color?: string;
    title?: string;
  }>;
};

const ICON_OPTIONS: IconOption[] = [
  { id: "instagram", label: "Instagram", Icon: SiInstagram },
  { id: "x", label: "X", Icon: SiX },
  { id: "discord", label: "Discord", Icon: SiDiscord },
  { id: "youtube", label: "YouTube", Icon: SiYoutube },
  { id: "spotify", label: "Spotify", Icon: SiSpotify },
  { id: "soundcloud", label: "SoundCloud", Icon: SiSoundcloud },
  { id: "tiktok", label: "TikTok", Icon: SiTiktok },
  { id: "twitch", label: "Twitch", Icon: SiTwitch },
  { id: "github", label: "GitHub", Icon: SiGithub },
  { id: "telegram", label: "Telegram", Icon: SiTelegram },
  { id: "whatsapp", label: "WhatsApp", Icon: SiWhatsapp },
  { id: "facebook", label: "Facebook", Icon: SiFacebook },
  { id: "reddit", label: "Reddit", Icon: SiReddit },
  { id: "snapchat", label: "Snapchat", Icon: SiSnapchat },
  { id: "pinterest", label: "Pinterest", Icon: SiPinterest },
  { id: "dribbble", label: "Dribbble", Icon: SiDribbble },
  { id: "behance", label: "Behance", Icon: SiBehance },
  { id: "patreon", label: "Patreon", Icon: SiPatreon },
  { id: "steam", label: "Steam", Icon: SiSteam },
];

export const SocialButtonDialog = ({
  app,
  onClose,
}: {
  app: AppClassProperties;
  onClose: () => void;
}) => {
  const [selectedIconId, setSelectedIconId] = useState(ICON_OPTIONS[0].id);
  const [actionType, setActionType] = useState<ActionType>("link");
  const [value, setValue] = useState("");
  const [color, setColor] = useState(app.state.currentItemStrokeColor);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOption = useMemo(
    () =>
      ICON_OPTIONS.find((option) => option.id === selectedIconId) ||
      ICON_OPTIONS[0],
    [selectedIconId],
  );

  const canSubmit = value.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const svgMarkup = renderToStaticMarkup(
        <selectedOption.Icon
          size={64}
          color={color}
          title={selectedOption.label}
        />,
      );

      await app.insertSocialButtonElement({
        network: selectedOption.id,
        svgMarkup,
        color,
        actionType,
        value: value.trim(),
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [
    actionType,
    app,
    canSubmit,
    color,
    isSubmitting,
    onClose,
    selectedOption,
    value,
  ]);

  const panelRef = useRef<HTMLDivElement>(null);

  useOutsideClick(panelRef, onClose);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYS.ESCAPE) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <Island ref={panelRef} padding={3} className="SocialButtonDialog">
      <div className="SocialButtonDialog__header">
        <h2 className="SocialButtonDialog__title">
          {t("socialButton.title")}
        </h2>
        <button
          type="button"
          className="SocialButtonDialog__close"
          onClick={onClose}
          aria-label={t("buttons.close")}
        >
          {CloseIcon}
        </button>
      </div>
      <div className="SocialButtonDialog__description">
        {t("socialButton.description")}
      </div>

      <div className="SocialButtonDialog__label">
        {t("socialButton.network")}
      </div>
      <div className="SocialButtonDialog__grid">
        {ICON_OPTIONS.map((option) => {
          const Icon = option.Icon;
          const selected = option.id === selectedIconId;
          return (
            <button
              key={option.id}
              type="button"
              className="SocialButtonDialog__iconOption"
              aria-label={option.label}
              title={option.label}
              data-selected={selected}
              onClick={() => setSelectedIconId(option.id)}
            >
              <Icon size={20} color="currentColor" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
      <div className="SocialButtonDialog__selectedNetwork">
        {selectedOption.label}
      </div>

      <div className="SocialButtonDialog__row">
        <label className="SocialButtonDialog__label">
          {t("socialButton.action")}
        </label>
        <div className="SocialButtonDialog__actionPicker">
          <button
            type="button"
            className="SocialButtonDialog__pill"
            data-selected={actionType === "link"}
            onClick={() => setActionType("link")}
          >
            {t("socialButton.link")}
          </button>
          <button
            type="button"
            className="SocialButtonDialog__pill"
            data-selected={actionType === "clipboard"}
            onClick={() => setActionType("clipboard")}
          >
            {t("socialButton.clipboard")}
          </button>
        </div>
      </div>

      <div className="SocialButtonDialog__row">
        <label className="SocialButtonDialog__label">
          {actionType === "link"
            ? t("socialButton.linkValue")
            : t("socialButton.clipboardValue")}
        </label>
        <TextField
          value={value}
          onChange={setValue}
          fullWidth
          placeholder={
            actionType === "link"
              ? t("socialButton.linkPlaceholder")
              : t("socialButton.clipboardPlaceholder")
          }
        />
      </div>

      <div className="SocialButtonDialog__row">
        <label
          className="SocialButtonDialog__label"
          htmlFor="social-icon-color"
        >
          {t("socialButton.color")}
        </label>
        <input
          id="social-icon-color"
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="SocialButtonDialog__colorInput"
        />
      </div>

      <div className="SocialButtonDialog__actions">
        <DialogActionButton label={t("buttons.cancel")} onClick={onClose} />
        <DialogActionButton
          label={t("socialButton.add")}
          actionType="primary"
          disabled={!canSubmit}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        />
      </div>
    </Island>
  );
};
