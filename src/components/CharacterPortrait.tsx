"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getCharacterSkins, getClassicSkinIndex } from "~/characters/skin/registry";

interface CharacterPortraitProps {
  characterId: string;
  characterName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  autoRotate?: boolean;
  rotateMs?: number;
  showLabel?: boolean;
  showDots?: boolean;
  enableLightbox?: boolean;
}

export function CharacterPortrait({
  characterId,
  characterName,
  className,
  size = "sm",
  autoRotate = true,
  rotateMs = 4500,
  showLabel = false,
  showDots = true,
  enableLightbox = true,
}: CharacterPortraitProps) {
  const skins = getCharacterSkins(characterId);
  const classicIndex = getClassicSkinIndex(skins);
  const [index, setIndex] = useState(classicIndex);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const canRotate = skins.length > 1;

  const goTo = useCallback(
    (nextIndex: number) => {
      if (!canRotate) return;
      setIndex(((nextIndex % skins.length) + skins.length) % skins.length);
    },
    [canRotate, skins.length],
  );

  const next = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  const prev = useCallback(() => {
    goTo(index - 1);
  }, [goTo, index]);

  useEffect(() => {
    setIndex(getClassicSkinIndex(getCharacterSkins(characterId)));
  }, [characterId]);

  useEffect(() => {
    if (!autoRotate || !canRotate || lightboxOpen) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % skins.length);
    }, rotateMs);
    return () => clearInterval(timer);
  }, [autoRotate, canRotate, rotateMs, skins.length, lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight" && canRotate) {
        setIndex((current) => (current + 1) % skins.length);
      }
      if (e.key === "ArrowLeft" && canRotate) {
        setIndex((current) => (current - 1 + skins.length) % skins.length);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen, canRotate, skins.length]);

  const skin = skins[index] ?? skins[classicIndex]!;
  const displayName = characterName ?? characterId;

  const lightbox =
    lightboxOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="portrait-lightbox-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`${displayName} · ${skin.label}`}
            onClick={() => setLightboxOpen(false)}
          >
            <div className="portrait-lightbox" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="portrait-lightbox-close"
                aria-label="关闭"
                onClick={() => setLightboxOpen(false)}
              >
                ✕
              </button>

              <div className="portrait-lightbox-header">
                <span className="portrait-lightbox-name">{displayName}</span>
                <span className="portrait-lightbox-skin">{skin.label}</span>
              </div>

              <div className="portrait-lightbox-stage">
                {canRotate && (
                  <button type="button" className="portrait-lightbox-nav prev" aria-label="上一张皮肤" onClick={prev}>
                    ‹
                  </button>
                )}
                <img
                  src={skin.image.src}
                  alt={`${displayName} · ${skin.label}`}
                  className="portrait-lightbox-img"
                  width={skin.image.width}
                  height={skin.image.height}
                  draggable={false}
                />
                {canRotate && (
                  <button type="button" className="portrait-lightbox-nav next" aria-label="下一张皮肤" onClick={next}>
                    ›
                  </button>
                )}
              </div>

              {canRotate && (
                <div className="portrait-lightbox-dots" role="tablist" aria-label="皮肤选择">
                  {skins.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      className={`character-portrait-dot${i === index ? " active" : ""}`}
                      aria-selected={i === index}
                      aria-label={s.label}
                      title={s.label}
                      onClick={() => goTo(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className={[
          "character-portrait",
          `character-portrait-${size}`,
          enableLightbox ? "character-portrait-zoomable" : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          type="button"
          className="character-portrait-frame"
          onClick={() => enableLightbox && setLightboxOpen(true)}
          aria-label={`放大查看 · ${skin.label}`}
          title="点击放大查看"
        >
          <img
            key={skin.id}
            src={skin.image.src}
            alt={`${skin.label}皮肤`}
            className="character-portrait-img"
            width={skin.image.width}
            height={skin.image.height}
            draggable={false}
          />
          {enableLightbox && <span className="character-portrait-zoom-hint">放大</span>}
          {showLabel && <span className="character-portrait-label">{skin.label}</span>}
        </button>

        {showDots && canRotate && (
          <div className="character-portrait-dots" role="tablist" aria-label="皮肤选择">
            {skins.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                className={`character-portrait-dot${i === index ? " active" : ""}`}
                aria-selected={i === index}
                aria-label={s.label}
                title={s.label}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
              />
            ))}
          </div>
        )}
      </div>
      {lightbox}
    </>
  );
}
