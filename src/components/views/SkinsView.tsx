"use client";

import { useState } from "react";
import { CHARACTERS } from "~/data/characters";
import { showToast } from "~/components/Toast";
import { SkinUploadFields } from "~/components/SkinUploadFields";
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
  const [characterId, setCharacterId] = useState("");
  const skins = getAllSkins();
  const charOptions = getCharacterOptions();

  void refreshKey;

  const handleLike = (skinId: string) => {
    const result = like(skinId);
    if (result.ok) {
      if (result.likes !== undefined && result.likes >= 100) {
        showToast("🎉 恭喜获得「史诗级造梗王」称号！", "success");
      }
      setRefreshKey((k) => k + 1);
    }
  };

  const selectedChar = charOptions.find((c) => c.id === characterId);

  return (
    <>
      <section className="page-header">
        <h2>🎨 梗图皮肤工坊</h2>
        <p>上传肖像梗图，审核通过后加入角色皮肤轮换</p>
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
        <div className="form-row">
          <label htmlFor="skin-character">绑定角色</label>
          <select
            id="skin-character"
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
            required
          >
            <option value="">请选择角色</option>
            {charOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
        {characterId ? (
          <SkinUploadFields
            characterName={selectedChar?.name}
            submitLabel="上传皮肤"
            onSubmit={(data) =>
              createSkin({
                name: data.name,
                characterId,
                imageUrl: data.imageUrl,
                imageWidth: data.imageWidth,
                imageHeight: data.imageHeight,
              })
            }
            onSuccess={() => setRefreshKey((k) => k + 1)}
          />
        ) : (
          <p className="empty">请先选择要绑定的角色</p>
        )}
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
      {skin.imageUrl ? (
        <div className="skin-card-image-wrap">
          <img src={skin.imageUrl} alt={skin.name} className="skin-card-image" />
        </div>
      ) : (
        <div className="skin-emoji">{skin.emoji || "🎨"}</div>
      )}
      <h4>{skin.name}</h4>
      <div className="skin-meta">
        <span>{skin.official ? "官方" : skin.author || "匿名"}</span>
        {char && (
          <span>
            {char.emoji} {char.name}
          </span>
        )}
      </div>
      <button className="btn-like" disabled={skin.official} onClick={() => onLike(skin.id)}>
        ❤️ {Number(skin.likes) || 0}
      </button>
    </div>
  );
}
