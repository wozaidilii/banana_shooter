"use client";

import { useEffect, useState } from "react";
import { showToast } from "~/components/Toast";
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
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("🎨");

  useEffect(() => {
    if (!open) return;
    setName("");
    setDesc("");
    setEmoji("🎨");
  }, [open, characterId]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createSkin({
      name,
      desc,
      characterId,
      emoji,
    });
    if (result.ok) {
      showToast("皮肤已提交，等待管理员审核通过后展示", "success");
      onSubmitted?.();
      onClose();
    } else {
      showToast(result.reason ?? "提交失败", "error");
    }
  };

  return (
    <div className="login-modal-overlay" role="dialog" aria-modal="true" aria-label="上传皮肤" onClick={onClose}>
      <div className="login-modal skin-submit-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="login-modal-close" aria-label="关闭" onClick={onClose}>
          ✕
        </button>
        <div className="login-modal-header">
          <h2>上传梗图皮肤</h2>
          <p>
            绑定角色：<strong>{characterName}</strong> · 审核通过后才会在皮肤广场展示
          </p>
        </div>
        <form className="skin-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="skin-name">皮肤名称</label>
            <input
              id="skin-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：冰红茶战神·究极体"
              maxLength={30}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="skin-desc">皮肤描述</label>
            <textarea
              id="skin-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="描述你的抽象创意……"
              maxLength={200}
              rows={3}
            />
          </div>
          <div className="form-row">
            <label htmlFor="skin-emoji">表情/图标</label>
            <input
              id="skin-emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🎨"
              maxLength={4}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            提交审核
          </button>
        </form>
      </div>
    </div>
  );
}
