import { useCallback, useEffect, useRef, useState } from "react";

import { KEYS } from "@excalidraw/common";

import { t } from "../i18n";
import { useOutsideClick } from "../hooks/useOutsideClick";

import DialogActionButton from "./DialogActionButton";
import { TextField } from "./TextField";
import { Island } from "./Island";
import { ImageIcon, CloseIcon } from "./icons";

import "./ImageLinkDialog.scss";

import type { AppClassProperties } from "../types";

const isValidImageURL = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const ImageLinkDialog = ({
  app,
  onClose,
}: {
  app: AppClassProperties;
  onClose: () => void;
}) => {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowImageUpload = app.props.allowImageUpload ?? false;

  const canSubmit = url.trim().length > 0 && isValidImageURL(url.trim());

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await app.insertImageFromURL({ url: url.trim() });
      onClose();
    } catch {
      setError(t("imageLink.error"));
    } finally {
      setIsSubmitting(false);
    }
  }, [app, canSubmit, isSubmitting, onClose, url]);

  const handleUploadClick = useCallback(() => {
    if (!allowImageUpload) {
      return;
    }
    app.onImageUploadClick();
    onClose();
  }, [allowImageUpload, app, onClose]);

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
    <Island ref={panelRef} padding={3} className="ImageLinkDialog">
      <div className="ImageLinkDialog__header">
        <h2 className="ImageLinkDialog__title">{t("imageLink.title")}</h2>
        <button
          type="button"
          className="ImageLinkDialog__close"
          onClick={onClose}
          aria-label={t("buttons.close")}
        >
          {CloseIcon}
        </button>
      </div>
      <div className="ImageLinkDialog__description">
        {t("imageLink.description")}
      </div>

      <div className="ImageLinkDialog__row">
        <label className="ImageLinkDialog__label">
          {t("imageLink.urlLabel")}
        </label>
        <TextField
          value={url}
          onChange={(val) => {
            setUrl(val);
            setError(null);
          }}
          fullWidth
          placeholder={t("imageLink.urlPlaceholder")}
        />
        {error && <p className="ImageLinkDialog__error">{error}</p>}
      </div>

      <div className="ImageLinkDialog__actions">
        <DialogActionButton label={t("buttons.cancel")} onClick={onClose} />
        <DialogActionButton
          label={t("imageLink.add")}
          actionType="primary"
          disabled={!canSubmit}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        />
      </div>

      <div className="ImageLinkDialog__divider" />

      <button
        type="button"
        className="ImageLinkDialog__uploadOption"
        disabled={!allowImageUpload}
        onClick={handleUploadClick}
      >
        <span className="ImageLinkDialog__uploadIcon">{ImageIcon}</span>
        <span className="ImageLinkDialog__uploadText">
          <span className="ImageLinkDialog__uploadTitle">
            {t("imageLink.uploadTitle")}
          </span>
          <span className="ImageLinkDialog__uploadSubtitle">
            {allowImageUpload
              ? t("imageLink.uploadSubtitle")
              : t("imageLink.uploadPremium")}
          </span>
        </span>
        {!allowImageUpload && (
          <span className="ImageLinkDialog__premiumBadge">PRO</span>
        )}
      </button>
    </Island>
  );
};
