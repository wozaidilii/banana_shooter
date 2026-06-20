"use client";

import { useState } from "react";
import { OFFICIAL_TITLES, type OfficialTitle } from "~/data/titles";
import { showToast } from "~/components/Toast";
import { getAllSkins } from "~/lib/skins";
import { getChatCount, getProfile, getTitles, saveProfile } from "~/lib/storage";

const RARITY_ICONS: Record<string, string> = {
  common: "🪙",
  rare: "💎",
  epic: "🔥",
  legendary: "👑",
};

export function ProfileView() {
  const [profile, setProfile] = useState(getProfile);
  const titles = getTitles();
  const titleList = titles
    .map((id) => OFFICIAL_TITLES[id])
    .filter((t): t is OfficialTitle => t !== undefined);
  const allTitles = Object.values(OFFICIAL_TITLES);

  const handleSave = () => {
    const name = profile.nickname.trim();
    if (name) {
      saveProfile({ nickname: name });
      showToast("昵称已保存", "success");
    }
  };

  return (
    <>
      <section className="page-header">
        <h2>👤 冥界档案</h2>
        <p>你的称号与参与记录</p>
      </section>

      <section className="profile-card">
        <div className="profile-avatar">{profile.avatar || "👻"}</div>
        <div className="profile-info">
          <input
            className="profile-name-input"
            value={profile.nickname}
            onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
            maxLength={20}
          />
          <small>加入冥界：{new Date(profile.joinedAt).toLocaleDateString("zh-CN")}</small>
        </div>
        <button className="btn-sm" onClick={handleSave}>
          保存
        </button>
      </section>

      <section className="section">
        <h3 className="section-subtitle">已获称号 ({titleList.length})</h3>
        <div className="title-grid">
          {titleList.length ? (
            titleList.map((t) => (
              <div key={t.id} className={`title-badge rarity-${t.rarity}`}>
                <span className="title-icon">{RARITY_ICONS[t.rarity] ?? "🏅"}</span>
                <strong>{t.name}</strong>
                <p>{t.desc}</p>
              </div>
            ))
          ) : (
            <p className="empty">还没有称号，快去投票、聊天、造梗吧</p>
          )}
        </div>
      </section>

      <section className="section">
        <h3 className="section-subtitle">全部称号一览</h3>
        <div className="title-grid locked">
          {allTitles.map((t) => {
            const earned = titles.includes(t.id);
            return (
              <div
                key={t.id}
                className={`title-badge rarity-${t.rarity}${earned ? "" : " locked-badge"}`}
              >
                <span className="title-icon">{earned ? "✅" : "🔒"}</span>
                <strong>{t.name}</strong>
                <p>{t.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section stats">
        <div className="stat-item">
          <span>{getChatCount()}</span>
          <label>对话次数</label>
        </div>
        <div className="stat-item">
          <span>{getAllSkins().filter((s) => !s.official).length}</span>
          <label>上传皮肤</label>
        </div>
        <div className="stat-item">
          <span>{titles.length}</span>
          <label>获得称号</label>
        </div>
      </section>
    </>
  );
}
