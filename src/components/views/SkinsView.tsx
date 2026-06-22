"use client";

import { useState } from "react";
import { CHARACTERS } from "~/data/characters";
import { showToast } from "~/components/Toast";
import {
  createSkin,
  getAllSkins,
  getCharacterOptions,
  like,
  SKIN_TEMPLATES,
  type DisplaySkin,
} from "~/lib/skins";

export function SkinsView() {
  const [refreshKey, setRefreshKey] = useState(0);
  const skins = getAllSkins();
  const charOptions = getCharacterOptions();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = createSkin({
      name: String(fd.get("name") ?? ""),
      characterId: String(fd.get("characterId") ?? ""),
      desc: String(fd.get("desc") ?? ""),
      emoji: String(fd.get("emoji") ?? "🎨"),
    });
    if (result.ok) {
      showToast("皮肤已提交，等待管理员审核通过后展示", "success");
      setRefreshKey((k) => k + 1);
      e.currentTarget.reset();
    } else {
      showToast(result.reason ?? "上传失败", "error");
    }
  };

  const handleLike = (skinId: string) => {
    const result = like(skinId);
    if (result.ok) {
      if (result.likes !== undefined && result.likes >= 100) {
        showToast("🎉 恭喜获得「史诗级造梗王」称号！", "success");
      }
      setRefreshKey((k) => k + 1);
    }
  };

  void refreshKey;

  return (
    <>
      <section className="page-header">
        <h2>🎨 梗图皮肤工坊</h2>
        <p>上传你的史诗级抽象皮肤，出圈赢专属称号</p>
      </section>

      <section className="section">
        <h3 className="section-subtitle">官方梗图方向</h3>
        <div className="template-grid">
          {SKIN_TEMPLATES.map((t) => (
            <div key={t.id} className="template-card">
              <span className="template-emoji">{t.emoji}</span>
              <strong>{t.name}</strong>
              <p>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section create-skin">
        <h3 className="section-subtitle">创作你的皮肤</h3>
        <form className="skin-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>皮肤名称</label>
            <input name="name" placeholder="例：冰红茶战神·究极体" maxLength={30} required />
          </div>
          <div className="form-row">
            <label>绑定角色</label>
            <select name="characterId" defaultValue="">
              <option value="">通用皮肤</option>
              {charOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>皮肤描述</label>
            <textarea name="desc" placeholder="描述你的抽象创意……" maxLength={200} rows={3} />
          </div>
          <div className="form-row">
            <label>表情/图标</label>
            <input name="emoji" placeholder="🎨" maxLength={4} defaultValue="🎨" />
          </div>
          <button type="submit" className="btn btn-primary">
            上传皮肤
          </button>
        </form>
      </section>

      <section className="section">
        <h3 className="section-subtitle">皮肤广场</h3>
        <p className="section-hint">仅展示已通过管理员审核的皮肤</p>
        <div className="skin-grid">
          {skins.length ? (
            skins.map((s) => <SkinCard key={s.id} skin={s} onLike={handleLike} />)
          ) : (
            <p className="empty">还没有皮肤，来做第一个造梗王</p>
          )}
        </div>
      </section>
    </>
  );
}

function SkinCard({ skin, onLike }: { skin: DisplaySkin; onLike: (id: string) => void }) {
  const char = CHARACTERS.find((c) => c.id === skin.characterId);
  return (
    <div className="skin-card" data-skin={skin.id}>
      <div className="skin-emoji">{skin.emoji || "🎨"}</div>
      <h4>{skin.name}</h4>
      <p>{skin.desc || ""}</p>
      <div className="skin-meta">
        <span>{skin.official ? "官方" : skin.author || "匿名"}</span>
        {char && (
          <span>
            {char.emoji} {char.name}
          </span>
        )}
      </div>
      <button
        className="btn-like"
        disabled={skin.official}
        onClick={() => onLike(skin.id)}
      >
        ❤️ {Number(skin.likes) || 0}
      </button>
    </div>
  );
}
