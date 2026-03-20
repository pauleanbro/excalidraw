import {
  FONT_FAMILY,
  VERTICAL_ALIGN,
  escapeDoubleQuotes,
  getFontString,
} from "@excalidraw/common";

import type { ExcalidrawProps } from "@excalidraw/excalidraw/types";
import type { MarkRequired } from "@excalidraw/common/utility-types";

import { newTextElement } from "./newElement";
import { wrapText } from "./textWrapping";
import { isIframeElement } from "./typeChecks";

import type {
  ExcalidrawElement,
  ExcalidrawIframeLikeElement,
  IframeData,
} from "./types";

type IframeDataWithSandbox = MarkRequired<IframeData, "sandbox">;

const embeddedLinkCache = new Map<string, IframeDataWithSandbox>();

const RE_YOUTUBE =
  /^(?:http(?:s)?:\/\/)?(?:www\.)?youtu(?:be\.com|\.be)\/(embed\/|watch\?v=|shorts\/|playlist\?list=|embed\/videoseries\?list=)?([a-zA-Z0-9_-]+)/;

const RE_VIMEO =
  /^(?:http(?:s)?:\/\/)?(?:(?:w){3}\.)?(?:player\.)?vimeo\.com\/(?:video\/)?([^?\s]+)(?:\?.*)?$/;
const RE_FIGMA = /^https:\/\/(?:www\.)?figma\.com/;

const RE_GH_GIST = /^https:\/\/gist\.github\.com\/([\w_-]+)\/([\w_-]+)/;
const RE_GH_GIST_EMBED =
  /^<script[\s\S]*?\ssrc=["'](https:\/\/gist\.github\.com\/.*?)\.js["']/i;

const RE_MSFORMS = /^(?:https?:\/\/)?forms\.microsoft\.com\//;

// not anchored to start to allow <blockquote> twitter embeds
const RE_TWITTER =
  /(?:https?:\/\/)?(?:(?:w){3}\.)?(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/;
const RE_TWITTER_EMBED =
  /^<blockquote[\s\S]*?\shref=["'](https?:\/\/(?:twitter|x)\.com\/[^"']*)/i;

const RE_VALTOWN =
  /^https:\/\/(?:www\.)?val\.town\/(v|embed)\/[a-zA-Z_$][0-9a-zA-Z_$]+\.[a-zA-Z_$][0-9a-zA-Z_$]+/;

const RE_GENERIC_EMBED =
  /^<(?:iframe|blockquote)[\s\S]*?\s(?:src|href)=["']([^"']*)["'][\s\S]*?>$/i;
const RE_GENERIC_IFRAME_SRC =
  /<iframe[\s\S]*?\ssrc=["']([^"']*)["'][\s\S]*?>/i;

const RE_GIPHY =
  /giphy.com\/(?:clips|embed|gifs)\/[a-zA-Z0-9]*?-?([a-zA-Z0-9]+)(?:[^a-zA-Z0-9]|$)/;

const RE_REDDIT =
  /^(?:http(?:s)?:\/\/)?(?:www\.)?reddit\.com\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9_]+)\/([a-zA-Z0-9_]+)\/?(?:\?[^#\s]*)?(?:#[^\s]*)?$/;

const RE_REDDIT_EMBED =
  /^<blockquote[\s\S]*?\shref=["'](https?:\/\/(?:www\.)?reddit\.com\/[^"']*)/i;
const RE_INSTAGRAM_EMBED =
  /^<blockquote[\s\S]*?data-instgrm-permalink=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']*)/i;

const parseYouTubeLikeTimestamp = (url: string): number => {
  let timeParam: string | null | undefined;

  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    timeParam =
      urlObj.searchParams.get("t") || urlObj.searchParams.get("start");
  } catch (error) {
    const timeMatch = url.match(/[?&#](?:t|start)=([^&#\s]+)/);
    timeParam = timeMatch?.[1];
  }

  if (!timeParam) {
    return 0;
  }

  if (/^\d+$/.test(timeParam)) {
    return parseInt(timeParam, 10);
  }

  const timeMatch = timeParam.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!timeMatch) {
    return 0;
  }

  const [, hours = "0", minutes = "0", seconds = "0"] = timeMatch;
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
};

const parseGoogleDriveVideoLink = (
  url: string,
): { fileId: string; resourceKey?: string; timestamp?: number } | null => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.replace(/^www\./, "");
    if (hostname !== "drive.google.com") {
      return null;
    }

    let fileId: string | null = null;
    const pathMatch = urlObj.pathname.match(/^\/file\/d\/([^/]+)(?:\/|$)/);
    if (pathMatch?.[1]) {
      fileId = pathMatch[1];
    } else if (urlObj.pathname === "/open" || urlObj.pathname === "/uc") {
      // Shared Drive links can be emitted as:
      // - /open?id=<fileId> (common "open in Drive" format)
      // - /uc?...&id=<fileId> (download/export endpoint often seen in copied links)
      fileId = urlObj.searchParams.get("id");
    }

    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      return null;
    }

    // Some Drive share links include `resourcekey` for access to link-shared
    // files; preserve it in the preview URL so embeds keep working.
    const resourceKey = urlObj.searchParams.get("resourcekey");
    const timestamp = parseYouTubeLikeTimestamp(urlObj.toString());

    return {
      fileId,
      resourceKey:
        resourceKey && /^[a-zA-Z0-9_-]+$/.test(resourceKey)
          ? resourceKey
          : undefined,
      // Drive accepts YouTube-like `t` formats (e.g. `t=90`, `t=1m30s`);
      // normalize to seconds for a stable preview URL.
      timestamp: timestamp > 0 ? timestamp : undefined,
    };
  } catch (error) {
    return null;
  }
};


const parseInstagramLink = (
  url: string,
): { type: "post" | "profile"; embedLink: string } | null => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.replace(/^www\./, "");
    if (hostname !== "instagram.com") {
      return null;
    }

    const segments = urlObj.pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return null;
    }

    const firstSegment = segments[0];
    const secondSegment = segments[1];

    if (
      ["p", "reel", "tv"].includes(firstSegment) &&
      secondSegment &&
      /^[a-zA-Z0-9_-]+$/.test(secondSegment)
    ) {
      return {
        type: "post",
        embedLink: `https://www.instagram.com/${firstSegment}/${secondSegment}/embed`,
      };
    }

    if (segments.length === 1 && /^[a-zA-Z0-9._]+$/.test(firstSegment)) {
      return {
        type: "profile",
        embedLink: `https://www.instagram.com/${firstSegment}/embed`,
      };
    }
  } catch (error) {
    return null;
  }

  return null;
};

const parseSpotifyLink = (
  url: string,
): { type: "generic"; embedLink: string } | null => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.replace(/^www\./, "");
    if (hostname !== "open.spotify.com") {
      return null;
    }

    const supportedTypes = new Set([
      "track",
      "album",
      "artist",
      "playlist",
      "show",
      "episode",
    ]);

    let segments = urlObj.pathname.split("/").filter(Boolean);

    // Handles localized links such as /intl-pt/track/<id>.
    if (segments[0]?.startsWith("intl-")) {
      segments = segments.slice(1);
    }

    const [contentType, contentId] = segments;
    if (
      !contentType ||
      !contentId ||
      !supportedTypes.has(contentType) ||
      !/^[a-zA-Z0-9]+$/.test(contentId)
    ) {
      return null;
    }

    return {
      type: "generic",
      embedLink: `https://open.spotify.com/embed/${contentType}/${contentId}`,
    };
  } catch (error) {
    return null;
  }
};

const parseSoundCloudLink = (
  url: string,
): { type: "generic"; embedLink: string } | null => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.replace(/^www\./, "");
    if (hostname !== "soundcloud.com" && hostname !== "w.soundcloud.com") {
      return null;
    }

    if (hostname === "w.soundcloud.com" && urlObj.pathname.startsWith("/player")) {
      return {
        type: "generic",
        embedLink: urlObj.toString(),
      };
    }

    const segments = urlObj.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      return null;
    }

    const canonicalTrackUrl = `https://soundcloud.com${urlObj.pathname}${
      urlObj.search || ""
    }`;
    const encodedTrackUrl = encodeURIComponent(canonicalTrackUrl).replace(
      /%2F/g,
      "/",
    );
    const embedLink =
      `https://w.soundcloud.com/player/?url=${encodedTrackUrl}` +
      `&color=%23ff5500&auto_play=false&hide_related=false` +
      `&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;

    return {
      type: "generic",
      embedLink,
    };
  } catch (error) {
    return null;
  }
};

const parseGoogleMapsLink = (
  url: string,
): { type: "generic"; embedLink: string } | null => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.replace(/^www\./, "");

    const isGoogleMapsHost =
      hostname === "google.com" || hostname === "maps.google.com";
    if (!isGoogleMapsHost) {
      return null;
    }

    const isGoogleComMapsPath = hostname === "google.com" &&
      urlObj.pathname.startsWith("/maps");
    const isMapsGoogleComPath = hostname === "maps.google.com";
    if (!isGoogleComMapsPath && !isMapsGoogleComPath) {
      return null;
    }

    if (urlObj.pathname.startsWith("/maps/embed")) {
      return {
        type: "generic",
        embedLink: `https://www.google.com${urlObj.pathname}${urlObj.search}`,
      };
    }

    let query =
      urlObj.searchParams.get("q") || urlObj.searchParams.get("query") || "";

    if (!query) {
      const placeMatch = urlObj.pathname.match(/\/(?:maps\/)?place\/([^/]+)/);
      if (placeMatch?.[1]) {
        query = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");
      }
    }

    if (!query) {
      const latLngMatch = urlObj.pathname.match(
        /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      );
      if (latLngMatch?.[1] && latLngMatch[2]) {
        query = `${latLngMatch[1]},${latLngMatch[2]}`;
      }
    }

    if (!query) {
      query = urlObj.searchParams.get("ll") || "";
    }

    if (!query) {
      query = urlObj.toString();
    }

    return {
      type: "generic",
      embedLink: `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`,
    };
  } catch (error) {
    return null;
  }
};

const ALLOWED_DOMAINS = new Set([
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "player.vimeo.com",
  "drive.google.com",
  "figma.com",
  "link.excalidraw.com",
  "gist.github.com",
  "twitter.com",
  "x.com",
  "*.simplepdf.eu",
  "stackblitz.com",
  "val.town",
  "giphy.com",
  "reddit.com",
  "forms.microsoft.com",
  "instagram.com",
  "open.spotify.com",
  "soundcloud.com",
  "w.soundcloud.com",
  "google.com",
  "maps.google.com",
]);

const ALLOW_SAME_ORIGIN = new Set([
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "player.vimeo.com",
  "drive.google.com",
  "figma.com",
  "twitter.com",
  "x.com",
  "*.simplepdf.eu",
  "stackblitz.com",
  "reddit.com",
  "forms.microsoft.com",
  "instagram.com",
  "open.spotify.com",
  "w.soundcloud.com",
]);

export const createSrcDoc = (body: string) => {
  return `<html><body>${body}</body></html>`;
};

export const getEmbedLink = (
  link: string | null | undefined,
): IframeDataWithSandbox | null => {
  if (!link) {
    return null;
  }

  if (embeddedLinkCache.has(link)) {
    return embeddedLinkCache.get(link)!;
  }

  const originalLink = link;

  const allowSameOrigin = ALLOW_SAME_ORIGIN.has(
    matchHostname(link, ALLOW_SAME_ORIGIN) || "",
  );

  let type: "video" | "generic" = "generic";
  let aspectRatio = { w: 560, h: 840 };
  const ytLink = link.match(RE_YOUTUBE);
  if (ytLink?.[2]) {
    const startTime = parseYouTubeLikeTimestamp(originalLink);
    const time = startTime > 0 ? `&start=${startTime}` : ``;
    const isPortrait = link.includes("shorts");
    type = "video";
    switch (ytLink[1]) {
      case "embed/":
      case "watch?v=":
      case "shorts/":
        link = `https://www.youtube.com/embed/${ytLink[2]}?enablejsapi=1${time}`;
        break;
      case "playlist?list=":
      case "embed/videoseries?list=":
        link = `https://www.youtube.com/embed/videoseries?list=${ytLink[2]}&enablejsapi=1${time}`;
        break;
      default:
        link = `https://www.youtube.com/embed/${ytLink[2]}?enablejsapi=1${time}`;
        break;
    }
    aspectRatio = isPortrait ? { w: 315, h: 560 } : { w: 560, h: 315 };
    embeddedLinkCache.set(originalLink, {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    });
    return {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    };
  }

  const vimeoLink = link.match(RE_VIMEO);
  if (vimeoLink?.[1]) {
    const target = vimeoLink?.[1];
    const error = !/^\d+$/.test(target)
      ? new URIError("Invalid embed link format")
      : undefined;
    type = "video";
    link = `https://player.vimeo.com/video/${target}?api=1`;
    aspectRatio = { w: 560, h: 315 };
    //warning deliberately ommited so it is displayed only once per link
    //same link next time will be served from cache
    embeddedLinkCache.set(originalLink, {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    });
    return {
      link,
      intrinsicSize: aspectRatio,
      type,
      error,
      sandbox: { allowSameOrigin },
    };
  }

  const googleDriveVideo = parseGoogleDriveVideoLink(link);
  if (googleDriveVideo) {
    type = "video";
    const searchParams = new URLSearchParams();
    if (googleDriveVideo.resourceKey) {
      searchParams.set("resourcekey", googleDriveVideo.resourceKey);
    }
    if (googleDriveVideo.timestamp) {
      searchParams.set("t", `${googleDriveVideo.timestamp}`);
    }

    const search = searchParams.toString();
    link = `https://drive.google.com/file/d/${googleDriveVideo.fileId}/preview${
      search ? `?${search}` : ""
    }`;
    aspectRatio = { w: 560, h: 315 };
    embeddedLinkCache.set(originalLink, {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    });
    return {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    };
  }

  const instagramLink = parseInstagramLink(link);
  if (instagramLink) {
    type = "generic";
    link = instagramLink.embedLink;
    aspectRatio =
      instagramLink.type === "post" ? { w: 400, h: 480 } : { w: 400, h: 700 };
    embeddedLinkCache.set(originalLink, {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    });
    return {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    };
  }

  const spotifyLink = parseSpotifyLink(link);
  if (spotifyLink) {
    type = spotifyLink.type;
    link = spotifyLink.embedLink;
    aspectRatio = { w: 400, h: 352 };
    embeddedLinkCache.set(originalLink, {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    });
    return {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    };
  }

  const soundCloudLink = parseSoundCloudLink(link);
  if (soundCloudLink) {
    type = soundCloudLink.type;
    link = soundCloudLink.embedLink;
    aspectRatio = { w: 560, h: 315 };
    embeddedLinkCache.set(originalLink, {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    });
    return {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    };
  }

  const googleMapsLink = parseGoogleMapsLink(link);
  if (googleMapsLink) {
    type = googleMapsLink.type;
    link = googleMapsLink.embedLink;
    aspectRatio = { w: 560, h: 420 };
    embeddedLinkCache.set(originalLink, {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    });
    return {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    };
  }

  const figmaLink = link.match(RE_FIGMA);
  if (figmaLink) {
    type = "generic";
    link = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(
      link,
    )}`;
    aspectRatio = { w: 550, h: 550 };
    embeddedLinkCache.set(originalLink, {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    });
    return {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    };
  }

  const valLink = link.match(RE_VALTOWN);
  if (valLink) {
    link =
      valLink[1] === "embed" ? valLink[0] : valLink[0].replace("/v", "/embed");
    embeddedLinkCache.set(originalLink, {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    });
    return {
      link,
      intrinsicSize: aspectRatio,
      type,
      sandbox: { allowSameOrigin },
    };
  }

  if (RE_MSFORMS.test(link) && !link.includes("embed=true")) {
    link += link.includes("?") ? "&embed=true" : "?embed=true";
  }

  if (RE_TWITTER.test(link)) {
    const postId = link.match(RE_TWITTER)![1];
    // the embed srcdoc still supports twitter.com domain only.
    // Note that we don't attempt to parse the username as it can consist of
    // non-latin1 characters, and the username in the url can be set to anything
    // without affecting the embed.
    const safeURL = escapeDoubleQuotes(
      `https://twitter.com/x/status/${postId}`,
    );

    const ret: IframeDataWithSandbox = {
      type: "document",
      srcdoc: (theme: string) =>
        createSrcDoc(
          `<blockquote class="twitter-tweet" data-dnt="true" data-theme="${theme}"><a href="${safeURL}"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`,
        ),
      intrinsicSize: { w: 480, h: 480 },
      sandbox: { allowSameOrigin },
    };
    embeddedLinkCache.set(originalLink, ret);
    return ret;
  }

  if (RE_REDDIT.test(link)) {
    const [, page, postId, title] = link.match(RE_REDDIT)!;
    const safeURL = escapeDoubleQuotes(
      `https://reddit.com/r/${page}/comments/${postId}/${title}`,
    );
    const ret: IframeDataWithSandbox = {
      type: "document",
      srcdoc: (theme: string) =>
        createSrcDoc(
          `<blockquote class="reddit-embed-bq" data-embed-theme="${theme}"><a href="${safeURL}"></a><br></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>`,
        ),
      intrinsicSize: { w: 480, h: 480 },
      sandbox: { allowSameOrigin },
    };
    embeddedLinkCache.set(originalLink, ret);
    return ret;
  }

  if (RE_GH_GIST.test(link)) {
    const [, user, gistId] = link.match(RE_GH_GIST)!;
    const safeURL = escapeDoubleQuotes(
      `https://gist.github.com/${user}/${gistId}`,
    );
    const ret: IframeDataWithSandbox = {
      type: "document",
      srcdoc: () =>
        createSrcDoc(`
          <script src="${safeURL}.js"></script>
          <style type="text/css">
            * { margin: 0px; }
            table, .gist { height: 100%; }
            .gist .gist-file { height: calc(100vh - 2px); padding: 0px; display: grid; grid-template-rows: 1fr auto; }
          </style>
        `),
      intrinsicSize: { w: 550, h: 720 },
      sandbox: { allowSameOrigin },
    };
    embeddedLinkCache.set(link, ret);
    return ret;
  }

  embeddedLinkCache.set(link, {
    link,
    intrinsicSize: aspectRatio,
    type,
    sandbox: { allowSameOrigin },
  });
  return {
    link,
    intrinsicSize: aspectRatio,
    type,
    sandbox: { allowSameOrigin },
  };
};

export const createPlaceholderEmbeddableLabel = (
  element: ExcalidrawIframeLikeElement,
): ExcalidrawElement => {
  let text: string;
  if (isIframeElement(element)) {
    text = "IFrame element";
  } else {
    text =
      !element.link || element?.link === "" ? "Empty Web-Embed" : element.link;
  }

  const fontSize = Math.max(
    Math.min(element.width / 2, element.width / text.length),
    element.width / 30,
  );
  const fontFamily = FONT_FAMILY.Helvetica;

  const fontString = getFontString({
    fontSize,
    fontFamily,
  });

  return newTextElement({
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
    strokeColor:
      element.strokeColor !== "transparent" ? element.strokeColor : "black",
    backgroundColor: "transparent",
    fontFamily,
    fontSize,
    text: wrapText(text, fontString, element.width - 20),
    textAlign: "center",
    verticalAlign: VERTICAL_ALIGN.MIDDLE,
    angle: element.angle ?? 0,
  });
};

const matchHostname = (
  url: string,
  /** using a Set assumes it already contains normalized bare domains */
  allowedHostnames: Set<string> | string,
): string | null => {
  try {
    const { hostname } = new URL(url);

    const bareDomain = hostname.replace(/^www\./, "");

    if (allowedHostnames instanceof Set) {
      if (ALLOWED_DOMAINS.has(bareDomain)) {
        return bareDomain;
      }

      const bareDomainWithFirstSubdomainWildcarded = bareDomain.replace(
        /^([^.]+)/,
        "*",
      );
      if (ALLOWED_DOMAINS.has(bareDomainWithFirstSubdomainWildcarded)) {
        return bareDomainWithFirstSubdomainWildcarded;
      }
      return null;
    }

    const bareAllowedHostname = allowedHostnames.replace(/^www\./, "");
    if (bareDomain === bareAllowedHostname) {
      return bareAllowedHostname;
    }
  } catch (error) {
    // ignore
  }
  return null;
};

export const maybeParseEmbedSrc = (str: string): string => {
  const twitterMatch = str.match(RE_TWITTER_EMBED);
  if (twitterMatch && twitterMatch.length === 2) {
    return twitterMatch[1];
  }

  const redditMatch = str.match(RE_REDDIT_EMBED);
  if (redditMatch && redditMatch.length === 2) {
    return redditMatch[1];
  }

  const instagramMatch = str.match(RE_INSTAGRAM_EMBED);
  if (instagramMatch && instagramMatch.length === 2) {
    return instagramMatch[1];
  }

  const gistMatch = str.match(RE_GH_GIST_EMBED);
  if (gistMatch && gistMatch.length === 2) {
    return gistMatch[1];
  }

  if (RE_GIPHY.test(str)) {
    return `https://giphy.com/embed/${RE_GIPHY.exec(str)![1]}`;
  }

  const iframeMatch = str.match(RE_GENERIC_IFRAME_SRC);
  if (iframeMatch && iframeMatch.length === 2) {
    return iframeMatch[1];
  }

  const match = str.match(RE_GENERIC_EMBED);
  if (match && match.length === 2) {
    return match[1];
  }

  return str;
};

export const embeddableURLValidator = (
  url: string | null | undefined,
  validateEmbeddable: ExcalidrawProps["validateEmbeddable"],
): boolean => {
  if (!url) {
    return false;
  }
  if (validateEmbeddable != null) {
    if (typeof validateEmbeddable === "function") {
      const ret = validateEmbeddable(url);
      // if return value is undefined, leave validation to default
      if (typeof ret === "boolean") {
        return ret;
      }
    } else if (typeof validateEmbeddable === "boolean") {
      return validateEmbeddable;
    } else if (validateEmbeddable instanceof RegExp) {
      return validateEmbeddable.test(url);
    } else if (Array.isArray(validateEmbeddable)) {
      for (const domain of validateEmbeddable) {
        if (domain instanceof RegExp) {
          if (url.match(domain)) {
            return true;
          }
        } else if (matchHostname(url, domain)) {
          return true;
        }
      }
      return false;
    }
  }

  return !!matchHostname(url, ALLOWED_DOMAINS);
};
