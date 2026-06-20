// 皮肤工坊

import { SKIN_TEMPLATES, CHARACTERS } from "./data.js";
import {
  addSkin,
  getSkins,
  likeSkin,
  grantTitle,
  getTitles,
} from "./storage.js";

export { SKIN_TEMPLATES };

/** 获取所有皮肤（官方模板 + 用户创作） */
export function getAllSkins() {
  const userSkins = getSkins();
  const official = SKIN_TEMPLATES.map((t) => ({
    ...t,
    id: `official_${t.id}`,
    official: true,
    author: "赛博墓碑官方",
    likes: Math.floor(Math.random() * 50) + 20,
    characterId: guessCharacterForTemplate(t.id),
  }));
  return [...userSkins, ...official];
}

/** 模板对应角色猜测 */
function guessCharacterForTemplate(templateId) {
  const map = {
    ice_tea: "laoda",
    gaokao: "zhangxuefeng",
    chicken: "caixukun",
    horse: "mabaoguo",
    pure: "dingzhen",
    cyber: "",
  };
  return map[templateId] || "";
}

/** 创建皮肤 */
export function createSkin(data) {
  const result = addSkin(data);
  if (!result.ok) return result;

  const titles = getTitles();
  if (!titles.includes("skin_creator")) {
    grantTitle("skin_creator");
  }

  return result;
}

/** 点赞皮肤并检查称号 */
export function like(skinId) {
  const likes = likeSkin(skinId);
  if (!likes) return { ok: false };

  // 模拟：高赞皮肤授予称号（实际应由官方审核）
  if (likes >= 100) {
    const skin = getSkins().find((s) => s.id === skinId);
    if (skin && !getTitles().includes("skin_viral")) {
      grantTitle("skin_viral");
    }
  }

  return { ok: true, likes };
}

/** 角色列表供选择 */
export function getCharacterOptions() {
  return CHARACTERS.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }));
}
