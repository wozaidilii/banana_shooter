"use client";

import { useEffect, useRef, useState } from "react";
import { showToast } from "~/components/Toast";
import { ACCEPTED_SKIN_IMAGE_TYPES, processSkinImageFile } from "~/lib/skin-image";

interface SkinUploadFieldsProps {
  characterName?: string;
  submitLabel?: string;
  onSubmit: (data: {
    name: string;
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
  }) => { ok: boolean; reason?: string };
  onSuccess?: () => void;
}

export function SkinUploadFields({
  characterName,
  submitLabel = "提交审核",
  onSubmit,
  onSuccess,
}: SkinUploadFieldsProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (next: File | null) => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !file || !name.trim()) return;

    setSubmitting(true);
    try {
      const processed = await processSkinImageFile(file);
      if (!processed.ok) {
        showToast(processed.reason, "error");
        return;
      }

      const result = onSubmit({
        name: name.trim(),
        imageUrl: processed.image.dataUrl,
        imageWidth: processed.image.width,
        imageHeight: processed.image.height,
      });

      if (result.ok) {
        showToast("皮肤已提交，等待管理员审核通过后展示", "success");
        setName("");
        handleFileChange(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onSuccess?.();
      } else {
        showToast(result.reason ?? "提交失败", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="skin-form" onSubmit={(e) => void handleSubmit(e)}>
      {characterName && (
        <p className="skin-upload-bind">
          绑定角色：<strong>{characterName}</strong>
        </p>
      )}
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
        <label htmlFor="skin-image">皮肤图片</label>
        <input
          ref={fileInputRef}
          id="skin-image"
          type="file"
          accept={ACCEPTED_SKIN_IMAGE_TYPES.join(",")}
          required
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        <span className="form-hint">支持 PNG / JPG / WEBP / GIF，最大 2MB</span>
      </div>
      {preview && (
        <div className="skin-upload-preview">
          <img src={preview} alt="皮肤预览" />
        </div>
      )}
      <button type="submit" className="btn btn-primary" disabled={submitting || !file || !name.trim()}>
        {submitting ? "上传中…" : submitLabel}
      </button>
    </form>
  );
}
