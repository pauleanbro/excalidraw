import React, { useCallback, useEffect, useRef, useState } from "react";

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
import { createAvatarFrameTemplate } from "../templates/avatarFrame";
import { createSocialRowTemplate } from "../templates/socialRow";

import { Island } from "./Island";
import { CloseIcon } from "./icons";

import "./TemplatesDialog.scss";

import type { SocialNetworkEntry } from "../templates/socialRow";
import type { AppClassProperties } from "../types";

type TemplatesDialogProps = {
  app: AppClassProperties;
  onClose: () => void;
};

type TemplateId = "avatarFrame" | "socialRow";

type TemplateItem = {
  id: TemplateId;
  label: string;
  description: string;
  preview: React.ReactNode;
  /** Whether this template needs an extra configuration step */
  needsConfig?: boolean;
};

const BADGE_URL = "/images/verificado.png";

const AVAILABLE_NETWORKS: SocialNetworkEntry[] = [
  { id: "instagram", label: "Instagram", Icon: SiInstagram, color: "#E4405F" },
  { id: "x", label: "X", Icon: SiX, color: "#000000" },
  { id: "discord", label: "Discord", Icon: SiDiscord, color: "#5865F2" },
  { id: "youtube", label: "YouTube", Icon: SiYoutube, color: "#FF0000" },
  { id: "spotify", label: "Spotify", Icon: SiSpotify, color: "#1DB954" },
  { id: "soundcloud", label: "SoundCloud", Icon: SiSoundcloud, color: "#FF3300" },
  { id: "tiktok", label: "TikTok", Icon: SiTiktok, color: "#000000" },
  { id: "twitch", label: "Twitch", Icon: SiTwitch, color: "#9146FF" },
  { id: "github", label: "GitHub", Icon: SiGithub, color: "#181717" },
  { id: "telegram", label: "Telegram", Icon: SiTelegram, color: "#26A5E4" },
  { id: "whatsapp", label: "WhatsApp", Icon: SiWhatsapp, color: "#25D366" },
  { id: "facebook", label: "Facebook", Icon: SiFacebook, color: "#0866FF" },
  { id: "reddit", label: "Reddit", Icon: SiReddit, color: "#FF4500" },
  { id: "snapchat", label: "Snapchat", Icon: SiSnapchat, color: "#FFFC00" },
  { id: "pinterest", label: "Pinterest", Icon: SiPinterest, color: "#BD081C" },
  { id: "dribbble", label: "Dribbble", Icon: SiDribbble, color: "#EA4C89" },
  { id: "behance", label: "Behance", Icon: SiBehance, color: "#1769FF" },
  { id: "patreon", label: "Patreon", Icon: SiPatreon, color: "#FF424D" },
  { id: "steam", label: "Steam", Icon: SiSteam, color: "#000000" },
];

const TEMPLATES: TemplateItem[] = [
  {
    id: "avatarFrame",
    label: "templates.avatarFrame.label",
    description: "templates.avatarFrame.description",
    preview: (
      <div className="TemplatesDialog__preview-avatar-frame">
        <div className="TemplatesDialog__preview-card">
          <div className="TemplatesDialog__preview-avatar" />
          <div className="TemplatesDialog__preview-name-row">
            <span className="TemplatesDialog__preview-name">Nome</span>
            <img
              src="/images/verificado.png"
              alt=""
              className="TemplatesDialog__preview-badge"
            />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "socialRow",
    label: "templates.socialRow.label",
    description: "templates.socialRow.description",
    needsConfig: true,
    preview: (
      <div className="TemplatesDialog__preview-social-row">
        <div className="TemplatesDialog__preview-social-card">
          {["#E4405F", "#000", "#5865F2", "#FF0000", "#1DB954"].map(
            (color, i) => (
              <div
                key={i}
                className="TemplatesDialog__preview-social-dot"
                style={{ background: color }}
              />
            ),
          )}
        </div>
      </div>
    ),
  },
];

const TemplatesDialog = ({ app, onClose }: TemplatesDialogProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inserting, setInserting] = useState<TemplateId | null>(null);
  const [configStep, setConfigStep] = useState<TemplateId | null>(null);
  const [selectedNetworks, setSelectedNetworks] = useState<Set<string>>(
    new Set(),
  );
  const [urlStep, setUrlStep] = useState(false);
  const [networkUrls, setNetworkUrls] = useState<Record<string, string>>({});
  const [networkActions, setNetworkActions] = useState<
    Record<string, "link" | "clipboard">
  >({});

  const allowTemplates = app.props.allowTemplates ?? false;

  useOutsideClick(ref, () => {
    if (urlStep) {
      setUrlStep(false);
    } else if (configStep) {
      setConfigStep(null);
      setSelectedNetworks(new Set());
    } else {
      onClose();
    }
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEYS.ESCAPE) {
        if (urlStep) {
          setUrlStep(false);
        } else if (configStep) {
          setConfigStep(null);
          setSelectedNetworks(new Set());
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [urlStep, configStep, onClose]);

  const toggleNetwork = useCallback((id: string) => {
    setSelectedNetworks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const insertTemplate = useCallback(
    async (filesMap: Record<string, any>, elements: readonly any[]) => {
      if (elements.length > 0) {
        app.addElementsFromPasteOrLibrary({
          elements,
          files: filesMap,
          position: "center",
        });
      }
      onClose();
    },
    [app, onClose],
  );

  const handleNextToUrls = useCallback(() => {
    setUrlStep(true);
    const urls: Record<string, string> = {};
    const actions: Record<string, "link" | "clipboard"> = {};
    for (const id of selectedNetworks) {
      urls[id] = "";
      actions[id] = "link";
    }
    setNetworkUrls(urls);
    setNetworkActions(actions);
  }, [selectedNetworks]);

  const handleInsert = useCallback(
    async (templateId: TemplateId) => {
      if (inserting || !allowTemplates) {
        return;
      }

      // If template needs config step, show picker
      const tpl = TEMPLATES.find((t) => t.id === templateId);
      if (tpl?.needsConfig && !configStep) {
        setConfigStep(templateId);
        return;
      }

      setInserting(templateId);

      try {
        if (templateId === "avatarFrame") {
          const userName =
            app.props.templateData?.userName || "Seu Nome";
          const userAvatarUrl = app.props.templateData?.userAvatarUrl;

          const { elements, files } = await createAvatarFrameTemplate({
            userName,
            userAvatarUrl,
            badgeUrl: BADGE_URL,
          });

          const filesMap: Record<string, any> = {};
          for (const file of files) {
            filesMap[file.id] = file;
          }
          await insertTemplate(filesMap, elements);
        } else if (templateId === "socialRow") {
          const networks = AVAILABLE_NETWORKS.filter((n) =>
            selectedNetworks.has(n.id),
          ).map((n) => ({
            ...n,
            value: networkUrls[n.id]?.trim() || undefined,
            actionType: networkActions[n.id] ?? ("link" as const),
          }));

          const { elements, files } = createSocialRowTemplate({ networks });

          const filesMap: Record<string, any> = {};
          for (const file of files) {
            filesMap[file.id] = file;
          }
          await insertTemplate(filesMap, elements);
        }
      } catch (err) {
        console.error("Failed to insert template:", err);
      } finally {
        setInserting(null);
        setConfigStep(null);
        setUrlStep(false);
        setSelectedNetworks(new Set());
        setNetworkUrls({});
        setNetworkActions({});
      }
    },
    [app, allowTemplates, inserting, configStep, selectedNetworks, networkUrls, networkActions, insertTemplate],
  );

  // ── Social Row URL config step ───────────────────────────
  if (configStep === "socialRow" && urlStep) {
    const orderedNetworks = AVAILABLE_NETWORKS.filter((n) =>
      selectedNetworks.has(n.id),
    );
    return (
      <Island ref={ref} padding={3} className="TemplatesDialog">
        <div className="TemplatesDialog__header">
          <button
            type="button"
            className="TemplatesDialog__back"
            onClick={() => setUrlStep(false)}
          >
            ←
          </button>
          <h3 className="TemplatesDialog__title">
            {t("templates.socialRow.urlTitle" as any)}
          </h3>
          <button
            type="button"
            className="TemplatesDialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            {CloseIcon}
          </button>
        </div>
        <p className="TemplatesDialog__description">
          {t("templates.socialRow.urlDescription" as any)}
        </p>
        <div className="TemplatesDialog__url-list">
          {orderedNetworks.map((net) => {
            const action = networkActions[net.id] ?? "link";
            return (
              <div key={net.id} className="TemplatesDialog__url-row">
                <div className="TemplatesDialog__url-icon">
                  <net.Icon size={18} color={net.color} />
                </div>
                <input
                  className="TemplatesDialog__url-input"
                  type={action === "link" ? "url" : "text"}
                  placeholder={
                    action === "link"
                      ? `https://${net.id}.com/...`
                      : `@user ou texto para copiar`
                  }
                  value={networkUrls[net.id] ?? ""}
                  onChange={(e) =>
                    setNetworkUrls((prev) => ({
                      ...prev,
                      [net.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  className={`TemplatesDialog__action-toggle ${
                    action === "clipboard"
                      ? "TemplatesDialog__action-toggle--clipboard"
                      : ""
                  }`}
                  title={
                    action === "link"
                      ? "Abrir link"
                      : "Copiar para clipboard"
                  }
                  onClick={() =>
                    setNetworkActions((prev) => ({
                      ...prev,
                      [net.id]:
                        prev[net.id] === "clipboard" ? "link" : "clipboard",
                    }))
                  }
                >
                  {action === "link" ? "🔗" : "📋"}
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="TemplatesDialog__confirm-btn"
          disabled={inserting !== null}
          onClick={() => handleInsert("socialRow")}
        >
          {inserting === "socialRow"
            ? t("templates.inserting")
            : t("templates.socialRow.insert" as any)}
        </button>
      </Island>
    );
  }

  // ── Social Row network picker step ──────────────────────
  if (configStep === "socialRow") {
    return (
      <Island ref={ref} padding={3} className="TemplatesDialog">
        <div className="TemplatesDialog__header">
          <button
            type="button"
            className="TemplatesDialog__back"
            onClick={() => {
              setConfigStep(null);
              setSelectedNetworks(new Set());
            }}
          >
            ←
          </button>
          <h3 className="TemplatesDialog__title">
            {t("templates.socialRow.pickerTitle" as any)}
          </h3>
          <button
            type="button"
            className="TemplatesDialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            {CloseIcon}
          </button>
        </div>
        <p className="TemplatesDialog__description">
          {t("templates.socialRow.pickerDescription" as any)}
        </p>
        <div className="TemplatesDialog__network-grid">
          {AVAILABLE_NETWORKS.map((net) => {
            const selected = selectedNetworks.has(net.id);
            return (
              <button
                key={net.id}
                type="button"
                className={`TemplatesDialog__network-item ${
                  selected ? "TemplatesDialog__network-item--selected" : ""
                }`}
                onClick={() => toggleNetwork(net.id)}
              >
                <net.Icon size={20} color={net.color} />
                <span className="TemplatesDialog__network-label">
                  {net.label}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="TemplatesDialog__confirm-btn"
          disabled={selectedNetworks.size === 0 || inserting !== null}
          onClick={handleNextToUrls}
        >
          {t("templates.socialRow.next" as any)}
        </button>
      </Island>
    );
  }

  // ── Main template grid ──────────────────────────────────

  return (
    <Island ref={ref} padding={3} className="TemplatesDialog">
      <div className="TemplatesDialog__header">
        <h3 className="TemplatesDialog__title">{t("templates.title")}</h3>
        <button
          type="button"
          className="TemplatesDialog__close"
          onClick={onClose}
          aria-label="Close"
        >
          {CloseIcon}
        </button>
      </div>
      <p className="TemplatesDialog__description">
        {allowTemplates
          ? t("templates.description")
          : t("templates.premiumDescription" as any)}
      </p>
      <div className="TemplatesDialog__grid">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className={`TemplatesDialog__item ${
              !allowTemplates ? "TemplatesDialog__item--locked" : ""
            }`}
            onClick={() => handleInsert(tpl.id)}
            disabled={inserting !== null || !allowTemplates}
          >
            <div className="TemplatesDialog__item-preview">
              {tpl.preview}
            </div>
            <div className="TemplatesDialog__item-label">
              {t(tpl.label as any)}
            </div>
            {!allowTemplates && (
              <div className="TemplatesDialog__item-pro-badge">PRO</div>
            )}
            {inserting === tpl.id && (
              <div className="TemplatesDialog__item-loading">
                {t("templates.inserting")}
              </div>
            )}
          </button>
        ))}
      </div>
    </Island>
  );
};

export default TemplatesDialog;
