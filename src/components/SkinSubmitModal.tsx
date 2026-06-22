"use client";

import { useEffect } from "react";
import { SkinUploadFields } from "~/components/SkinUploadFields";
import { createSkin } from "~/lib/skins";

interface SkinSubmitModalProps {
  open: boolean;
  characterId: string;
  characterName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function SkinSubmitModal({
  open,
  characterId,
  characterName,
  onClose,
  onSubmitted,
}: SkinSubmitModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="login-modal-overlay" role="dialog" aria-modal="true" aria-label="上传皮肤" onClick={onClose}>
      <div className="login-modal skin-submit-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="login-modal-close" aria-label="关闭" onClick={onClose}>
          ✕
        </button>
        <div className="login-modal-header">
          <h2>上传梗图皮肤</h2>
          <p>只需皮肤名称和图片，审核通过后才会展示</p>
        </div>
        <SkinUploadFields
          characterName={characterName}
          onSubmit={(data) =>
            createSkin({
              name: data.name,
              characterId,
              imageUrl: data.imageUrl,
              imageWidth: data.imageWidth,
              imageHeight: data.imageHeight,
            })
          }
          onSuccess={() => {
            onSubmitted?.();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
