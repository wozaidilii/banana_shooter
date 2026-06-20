// 本地存储层 — 投票、皮肤、称号、聊天记录

const KEYS = {
  votes: "cyberTomb_votes",
  userVotes: "cyberTomb_userVotes",
  skins: "cyberTomb_skins",
  titles: "cyberTomb_titles",
  chatCount: "cyberTomb_chatCount",
  profile: "cyberTomb_profile",
  chatHistory: "cyberTomb_chatHistory",
};

/** 安全解析 JSON */
function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** 安全写入 */
function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** 安全读取 */
function safeGet(key, fallback) {
  try {
    return safeParse(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

// ── 用户资料 ──

export function getProfile() {
  return safeGet(KEYS.profile, {
    nickname: "冥界游魂",
    avatar: "👻",
    joinedAt: Date.now(),
  });
}

export function saveProfile(patch) {
  const current = getProfile();
  return safeSet(KEYS.profile, { ...current, ...patch });
}

// ── 投票 ──

/** 全局票数（本地模拟 + 角色初始票） */
export function getVoteCounts() {
  return safeGet(KEYS.votes, {});
}

export function saveVoteCounts(counts) {
  return safeSet(KEYS.votes, counts);
}

/** 用户已投记录 { characterId: true } */
export function getUserVotes() {
  return safeGet(KEYS.userVotes, {});
}

export function castVote(characterId) {
  if (!characterId || typeof characterId !== "string") return { ok: false, reason: "无效角色" };

  const userVotes = getUserVotes();
  if (userVotes[characterId]) return { ok: false, reason: "已经投过票了" };

  const counts = getVoteCounts();
  counts[characterId] = (Number(counts[characterId]) || 0) + 1;
  userVotes[characterId] = true;

  safeSet(KEYS.votes, counts);
  safeSet(KEYS.userVotes, userVotes);

  return { ok: true };
}

// ── 称号 ──

export function getTitles() {
  const earned = safeGet(KEYS.titles, []);
  return Array.isArray(earned) ? earned : [];
}

export function grantTitle(titleId) {
  if (!titleId) return false;
  const titles = getTitles();
  if (titles.includes(titleId)) return false;
  titles.push(titleId);
  return safeSet(KEYS.titles, titles);
}

// ── 聊天计数 ──

export function getChatCount() {
  return Number(safeGet(KEYS.chatCount, 0)) || 0;
}

export function incrementChatCount() {
  const count = getChatCount() + 1;
  safeSet(KEYS.chatCount, count);
  return count;
}

/** 聊天记录 { characterId: [{role, content, ts}] } */
export function getChatHistory() {
  return safeGet(KEYS.chatHistory, {});
}

export function appendChatMessage(characterId, role, content) {
  if (!characterId || !content) return;
  const history = getChatHistory();
  if (!Array.isArray(history[characterId])) history[characterId] = [];
  history[characterId].push({ role, content, ts: Date.now() });
  // 最多保留 50 条
  if (history[characterId].length > 50) {
    history[characterId] = history[characterId].slice(-50);
  }
  safeSet(KEYS.chatHistory, history);
}

export function clearChatHistory(characterId) {
  const history = getChatHistory();
  if (characterId) {
    delete history[characterId];
  } else {
    Object.keys(history).forEach((k) => delete history[k]);
  }
  safeSet(KEYS.chatHistory, history);
}

// ── 皮肤 ──

export function getSkins() {
  const skins = safeGet(KEYS.skins, []);
  return Array.isArray(skins) ? skins : [];
}

export function addSkin(skin) {
  if (!skin || !skin.name) return { ok: false, reason: "皮肤名称不能为空" };
  const skins = getSkins();
  const entry = {
    id: `skin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: String(skin.name).slice(0, 30),
    desc: String(skin.desc || "").slice(0, 200),
    characterId: skin.characterId || "",
    templateId: skin.templateId || "",
    emoji: skin.emoji || "🎨",
    author: getProfile().nickname,
    likes: 0,
    adopted: false,
    createdAt: Date.now(),
  };
  skins.unshift(entry);
  safeSet(KEYS.skins, skins);
  return { ok: true, skin: entry };
}

export function likeSkin(skinId) {
  if (!skinId) return false;
  const skins = getSkins();
  const skin = skins.find((s) => s.id === skinId);
  if (!skin) return false;
  skin.likes = (Number(skin.likes) || 0) + 1;
  safeSet(KEYS.skins, skins);
  return skin.likes;
}

/** 初始化：合并角色初始票数 */
export function initStorage(characters) {
  const counts = getVoteCounts();
  let changed = false;
  for (const c of characters) {
    if (counts[c.id] == null) {
      counts[c.id] = Number(c.votes) || 0;
      changed = true;
    }
  }
  if (changed) saveVoteCounts(counts);

  // 早鸟称号
  grantTitle("early_bird");
}
