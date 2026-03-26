import { useCallback, useEffect, useRef, useState } from "react";

import { KEYS } from "@excalidraw/common";

import { t } from "../i18n";
import { useOutsideClick } from "../hooks/useOutsideClick";

import { Island } from "./Island";
import { CloseIcon, searchIcon } from "./icons";

import "./UnsplashDialog.scss";

import type { AppClassProperties } from "../types";

type UnsplashPhoto = {
  id: string;
  urls: {
    small: string;
    regular: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  links: {
    download_location: string;
  };
};

type UnsplashSearchResponse = {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
};

const UNSPLASH_API_URL = "https://api.unsplash.com";

const searchPhotos = async (
  query: string,
  accessKey: string,
  page = 1,
): Promise<UnsplashSearchResponse> => {
  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: "12",
    client_id: accessKey,
  });

  const response = await fetch(
    `${UNSPLASH_API_URL}/search/photos?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  return response.json();
};

const triggerDownload = (downloadLocation: string, accessKey: string) => {
  // Per Unsplash API guidelines, trigger download endpoint on selection
  fetch(`${downloadLocation}?client_id=${accessKey}`).catch(() => {
    // fire-and-forget
  });
};

export const UnsplashDialog = ({
  app,
  onClose,
}: {
  app: AppClassProperties;
  onClose: () => void;
}) => {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accessKey =
    (app.props as Record<string, unknown>).unsplashAccessKey as
      | string
      | undefined;

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || !accessKey) {
        setPhotos([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await searchPhotos(searchQuery.trim(), accessKey);
        setPhotos(data.results);
      } catch {
        setError(t("unsplash.error"));
        setPhotos([]);
      } finally {
        setIsLoading(false);
      }
    },
    [accessKey],
  );

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(value);
      }, 500);
    },
    [handleSearch],
  );

  const handleSelectPhoto = useCallback(
    async (photo: UnsplashPhoto) => {
      if (isInserting || !accessKey) {
        return;
      }

      setIsInserting(photo.id);

      try {
        triggerDownload(photo.links.download_location, accessKey);
        await app.insertImageFromURL({ url: photo.urls.regular });
        onClose();
      } catch {
        setError(t("unsplash.insertError"));
      } finally {
        setIsInserting(null);
      }
    },
    [accessKey, app, isInserting, onClose],
  );

  if (!accessKey) {
    return (
      <Island ref={panelRef} padding={3} className="UnsplashDialog">
        <div className="UnsplashDialog__header">
          <h2 className="UnsplashDialog__title">{t("unsplash.title")}</h2>
          <button
            type="button"
            className="UnsplashDialog__close"
            onClick={onClose}
            aria-label={t("buttons.close")}
          >
            {CloseIcon}
          </button>
        </div>
        <p className="UnsplashDialog__error">{t("unsplash.noApiKey")}</p>
      </Island>
    );
  }

  return (
    <Island ref={panelRef} padding={3} className="UnsplashDialog">
      <div className="UnsplashDialog__header">
        <h2 className="UnsplashDialog__title">{t("unsplash.title")}</h2>
        <button
          type="button"
          className="UnsplashDialog__close"
          onClick={onClose}
          aria-label={t("buttons.close")}
        >
          {CloseIcon}
        </button>
      </div>

      <div className="UnsplashDialog__description">
        {t("unsplash.description")}
      </div>

      <div className="UnsplashDialog__searchRow">
        <span className="UnsplashDialog__searchIcon">{searchIcon}</span>
        <input
          ref={inputRef}
          type="text"
          className="UnsplashDialog__searchInput"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t("unsplash.searchPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === KEYS.ENTER) {
              handleSearch(query);
            }
            e.stopPropagation();
          }}
        />
      </div>

      {error && <p className="UnsplashDialog__error">{error}</p>}

      <div className="UnsplashDialog__grid">
        {isLoading && (
          <div className="UnsplashDialog__loading">
            {t("unsplash.loading")}
          </div>
        )}
        {!isLoading && photos.length === 0 && query.trim() && (
          <div className="UnsplashDialog__empty">
            {t("unsplash.noResults")}
          </div>
        )}
        {!isLoading &&
          photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className="UnsplashDialog__photoCard"
              onClick={() => handleSelectPhoto(photo)}
              disabled={isInserting !== null}
              title={`${photo.alt_description ?? ""} — ${t("unsplash.by")} ${photo.user.name}`}
            >
              <img
                src={photo.urls.small}
                alt={photo.alt_description ?? ""}
                className="UnsplashDialog__photoImage"
                loading="lazy"
              />
              {isInserting === photo.id && (
                <div className="UnsplashDialog__photoOverlay">
                  {t("unsplash.inserting")}
                </div>
              )}
              <span className="UnsplashDialog__photoCredit">
                {photo.user.name}
              </span>
            </button>
          ))}
      </div>

      <div className="UnsplashDialog__attribution">
        {t("unsplash.poweredBy")}
      </div>
    </Island>
  );
};
