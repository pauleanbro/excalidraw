import React from "react";

import "./TemplatePreviews.scss";

const SOCIAL_COLORS = ["#E4405F", "#000", "#5865F2", "#FF0000", "#1DB954"];

export const AvatarFramePreview = ({
  badgeUrl = "/verificado.png",
  name = "Nome",
}: {
  badgeUrl?: string;
  name?: string;
}) => (
  <div className="TemplatePreview TemplatePreview--avatar-frame">
    <div className="TemplatePreview__avatar-card">
      <div className="TemplatePreview__avatar-circle" />
      <div className="TemplatePreview__avatar-name-row">
        <span className="TemplatePreview__avatar-name">{name}</span>
        <img
          src={badgeUrl}
          alt=""
          className="TemplatePreview__avatar-badge"
        />
      </div>
    </div>
  </div>
);

export const SocialRowPreview = ({
  colors = SOCIAL_COLORS,
}: {
  colors?: string[];
}) => (
  <div className="TemplatePreview TemplatePreview--social-row">
    <div className="TemplatePreview__social-card">
      {colors.map((color, i) => (
        <div
          key={i}
          className="TemplatePreview__social-dot"
          style={{ background: color }}
        />
      ))}
    </div>
  </div>
);
