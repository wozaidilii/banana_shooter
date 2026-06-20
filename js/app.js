// 赛博墓碑 — 主应用

import { CHARACTERS, OFFICIAL_TITLES } from "./data.js";
import {
  initStorage,
  getProfile,
  saveProfile,
  getTitles,
  getChatHistory,
  grantTitle,
  getChatCount,
} from "./storage.js";
import {
  getCountdown,
  formatCountdown,
  getLeaderboard,
  vote,
  isVotingEnded,
  getTotalVotes,
} from "./vote.js";
import { generateReply, getGreeting } from "./chat.js";
import { getAllSkins, createSkin, like, getCharacterOptions, SKIN_TEMPLATES } from "./skins.js";

// ── DOM 引用 ──
const $ = (sel) => document.querySelector(sel);
const app = $("#app");

let currentView = "home";
let currentChatId = null;
let countdownTimer = null;

// ── 路由 ──

const VIEWS = {
  home: renderHome,
  vote: renderVote,
  chat: renderChat,
  skins: renderSkins,
  profile: renderProfile,
};

function navigate(view, params = {}) {
  if (!VIEWS[view]) view = "home";
  currentView = view;
  if (params.characterId) currentChatId = params.characterId;

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  VIEWS[view](params);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── 通用组件 ──

function tombstoneCard(char, extra = "") {
  const pct = char.pct ?? 0;
  return `
    <div class="tombstone" style="--accent:${char.color || "#00ffcc"}" data-id="${char.id}">
      <div class="tombstone-top">
        <span class="tombstone-emoji">${char.emoji || "💀"}</span>
        <div class="tombstone-info">
          <h3 class="tombstone-name">${esc(char.name)}</h3>
          <p class="tombstone-tag">${esc(char.tagline || "")}</p>
        </div>
      </div>
      <p class="tombstone-epitaph">"${esc(char.epitaph || "")}"</p>
      ${extra}
    </div>
  `;
}

function esc(str) {
  const d = document.createElement("div");
  d.textContent = String(str ?? "");
  return d.innerHTML;
}

function showToast(msg, type = "info") {
  const existing = $(".toast");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

// ── 首页 ──

function renderHome() {
  const cd = getCountdown();
  const board = getLeaderboard();
  const top3 = board.slice(0, 3);
  const total = getTotalVotes();

  app.innerHTML = `
    <section class="hero">
      <div class="glitch-wrap">
        <h1 class="hero-title glitch" data-text="赛博墓碑">赛博墓碑</h1>
      </div>
      <p class="hero-sub">人物复活投票 · AI亡灵对话 · 梗图皮肤共创</p>
      <div class="countdown-box ${cd.ended ? "ended" : ""}">
        <span class="countdown-label">${cd.ended ? "复活赛已结束" : "复活赛倒计时"}</span>
        <span class="countdown-value" id="countdownDisplay">${formatCountdown(cd)}</span>
        <span class="countdown-hint">截止 2026.07.31 · 已有 ${total.toLocaleString()} 票</span>
      </div>
      <div class="hero-actions">
        <button class="btn btn-primary" data-action="vote">⚡ 进入复活赛</button>
        <button class="btn btn-ghost" data-action="chat">💬 与亡灵对话</button>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-icon">🏆</span> 复活榜 TOP3</h2>
      <div class="podium">
        ${top3.map((c, i) => `
          <div class="podium-item rank-${i + 1}">
            <span class="podium-rank">${["🥇", "🥈", "🥉"][i]}</span>
            <span class="podium-emoji">${c.emoji}</span>
            <span class="podium-name">${esc(c.name)}</span>
            <span class="podium-votes">${c.voteCount.toLocaleString()} 票</span>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-icon">⚰️</span> 冥界居民</h2>
      <div class="tombstone-grid">
        ${board.map((c) => tombstoneCard(c, `
          <div class="tombstone-meta">
            <span>${c.voteCount.toLocaleString()} 票</span>
            <button class="btn-sm" data-chat="${c.id}">对话</button>
          </div>
        `)).join("")}
      </div>
    </section>

    <section class="section features">
      <h2 class="section-title"><span class="section-icon">🔮</span> 核心玩法</h2>
      <div class="feature-grid">
        <div class="feature-card"><span>⚡</span><h4>复活赛投票</h4><p>投票决定谁能在赛博世界重生</p></div>
        <div class="feature-card"><span>💬</span><h4>AI亡灵对话</h4><p>缺德抽象，人设拉满</p></div>
        <div class="feature-card"><span>🎨</span><h4>梗图皮肤共创</h4><p>上传你的史诗级抽象皮肤</p></div>
        <div class="feature-card"><span>👑</span><h4>专属称号</h4><p>造梗出圈，赢取冥界头衔</p></div>
      </div>
    </section>
  `;

  bindActions(app);
  startCountdown();
}

// ── 复活赛 ──

function renderVote() {
  const cd = getCountdown();
  const ended = isVotingEnded();
  const board = getLeaderboard();
  const maxVotes = board[0]?.voteCount || 1;

  app.innerHTML = `
    <section class="page-header">
      <h2>⚡ 复活赛投票</h2>
      <p>投票决定谁能从赛博冥界重生</p>
      <div class="countdown-inline ${ended ? "ended" : ""}" id="countdownDisplay">
        ${ended ? "投票已截止" : `剩余 ${formatCountdown(cd)}`}
      </div>
    </section>

    <section class="vote-list">
      ${board.map((c, i) => {
        const pct = Math.round((c.voteCount / maxVotes) * 100);
        return `
          <div class="vote-card ${c.voted ? "voted" : ""}" style="--accent:${c.color}">
            <div class="vote-rank">#${i + 1}</div>
            <span class="vote-emoji">${c.emoji}</span>
            <div class="vote-info">
              <h3>${esc(c.name)} <span class="vote-real">${esc(c.realName)}</span></h3>
              <p>${esc(c.tagline)}</p>
              <div class="vote-bar"><div class="vote-bar-fill" style="width:${pct}%"></div></div>
              <span class="vote-count">${c.voteCount.toLocaleString()} 票 · ${pct}%</span>
            </div>
            <button class="btn-vote ${c.voted ? "done" : ""}" data-vote="${c.id}" ${ended || c.voted ? "disabled" : ""}>
              ${c.voted ? "已投票 ✓" : ended ? "已截止" : "投票复活"}
            </button>
          </div>
        `;
      }).join("")}
    </section>

    <section class="section hint-box">
      <p>💡 复活赛第一季截止 <strong>2026年7月31日</strong>，票数最高的亡灵将优先获得完整对话能力。第二季、名人堂……敬请期待。</p>
    </section>
  `;

  bindVoteEvents();
  startCountdown();
}

function bindVoteEvents() {
  app.querySelectorAll("[data-vote]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.vote;
      const result = vote(id);
      if (result.ok) {
        showToast("投票成功！冥界感受到了你的力量", "success");
        renderVote();
      } else {
        showToast(result.reason || "投票失败", "error");
      }
    });
  });
}

// ── 对话 ──

function renderChat(params = {}) {
  const chars = CHARACTERS;
  const activeId = params.characterId || currentChatId || chars[0]?.id;

  app.innerHTML = `
    <section class="page-header">
      <h2>💬 亡灵对话</h2>
      <p>缺德抽象，人设拉满 — 和赛博亡灵聊聊天</p>
    </section>

    <div class="chat-layout">
      <aside class="chat-sidebar">
        ${chars.map((c) => `
          <button class="chat-contact ${c.id === activeId ? "active" : ""}" data-chat-select="${c.id}">
            <span>${c.emoji}</span>
            <div>
              <strong>${esc(c.name)}</strong>
              <small>${esc(c.tagline)}</small>
            </div>
          </button>
        `).join("")}
      </aside>

      <div class="chat-main">
        <div class="chat-header" id="chatHeader"></div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input-area">
          <input type="text" id="chatInput" placeholder="说点什么缺德的……" maxlength="500" autocomplete="off" />
          <button class="btn btn-primary" id="chatSend">发送</button>
        </div>
      </div>
    </div>
  `;

  selectChatCharacter(activeId);
  bindChatEvents();
}

function selectChatCharacter(id) {
  currentChatId = id;
  const char = CHARACTERS.find((c) => c.id === id);
  if (!char) return;

  const header = $("#chatHeader");
  const messages = $("#chatMessages");
  if (!header || !messages) return;

  header.innerHTML = `
    <span class="chat-header-emoji">${char.emoji}</span>
    <div>
      <strong>${esc(char.name)}</strong>
      <small>${esc(char.realName)}</small>
    </div>
    <button class="btn-sm btn-ghost" id="chatClear">清空</button>
  `;

  const history = getChatHistory()[id] || [];
  const greeting = getGreeting(id);

  messages.innerHTML = `
    <div class="chat-bubble assistant">
      <span class="bubble-avatar">${char.emoji}</span>
      <div class="bubble-content">${esc(greeting)}</div>
    </div>
    ${history.map((m) => `
      <div class="chat-bubble ${m.role === "user" ? "user" : "assistant"}">
        ${m.role !== "user" ? `<span class="bubble-avatar">${char.emoji}</span>` : ""}
        <div class="bubble-content">${esc(m.content)}</div>
      </div>
    `).join("")}
  `;

  messages.scrollTop = messages.scrollHeight;

  app.querySelectorAll("[data-chat-select]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.chatSelect === id);
  });

  $("#chatClear")?.addEventListener("click", () => {
    import("./storage.js").then(({ clearChatHistory }) => {
      clearChatHistory(id);
      selectChatCharacter(id);
    });
  });
}

function bindChatEvents() {
  app.querySelectorAll("[data-chat-select]").forEach((btn) => {
    btn.addEventListener("click", () => selectChatCharacter(btn.dataset.chatSelect));
  });

  const input = $("#chatInput");
  const send = () => sendChatMessage();
  $("#chatSend")?.addEventListener("click", send);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
  });
}

async function sendChatMessage() {
  const input = $("#chatInput");
  const messages = $("#chatMessages");
  if (!input || !messages || !currentChatId) return;

  const text = input.value.trim();
  if (!text) return;

  const char = CHARACTERS.find((c) => c.id === currentChatId);

  // 用户消息
  messages.innerHTML += `
    <div class="chat-bubble user">
      <div class="bubble-content">${esc(text)}</div>
    </div>
  `;
  input.value = "";
  messages.scrollTop = messages.scrollHeight;

  // 打字指示
  const typingId = `typing-${Date.now()}`;
  messages.innerHTML += `
    <div class="chat-bubble assistant typing" id="${typingId}">
      <span class="bubble-avatar">${char?.emoji || "💀"}</span>
      <div class="bubble-content"><span class="typing-dots"><span></span><span></span><span></span></span></div>
    </div>
  `;
  messages.scrollTop = messages.scrollHeight;

  const result = await generateReply(currentChatId, text);
  document.getElementById(typingId)?.remove();

  messages.innerHTML += `
    <div class="chat-bubble assistant">
      <span class="bubble-avatar">${char?.emoji || "💀"}</span>
      <div class="bubble-content">${esc(result.reply)}</div>
    </div>
  `;
  messages.scrollTop = messages.scrollHeight;

  // 聊天称号
  const count = getChatCount();
  if (count >= 10) grantTitle("chat_10");
}

// ── 皮肤工坊 ──

function renderSkins() {
  const skins = getAllSkins();
  const charOptions = getCharacterOptions();

  app.innerHTML = `
    <section class="page-header">
      <h2>🎨 梗图皮肤工坊</h2>
      <p>上传你的史诗级抽象皮肤，出圈赢专属称号</p>
    </section>

    <section class="section">
      <h3 class="section-subtitle">官方梗图方向</h3>
      <div class="template-grid">
        ${SKIN_TEMPLATES.map((t) => `
          <div class="template-card">
            <span class="template-emoji">${t.emoji}</span>
            <strong>${esc(t.name)}</strong>
            <p>${esc(t.desc)}</p>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="section create-skin">
      <h3 class="section-subtitle">创作你的皮肤</h3>
      <form id="skinForm" class="skin-form">
        <div class="form-row">
          <label>皮肤名称</label>
          <input name="name" placeholder="例：冰红茶战神·究极体" maxlength="30" required />
        </div>
        <div class="form-row">
          <label>绑定角色</label>
          <select name="characterId">
            <option value="">通用皮肤</option>
            ${charOptions.map((c) => `<option value="${c.id}">${c.emoji} ${esc(c.name)}</option>`).join("")}
          </select>
        </div>
        <div class="form-row">
          <label>皮肤描述</label>
          <textarea name="desc" placeholder="描述你的抽象创意……" maxlength="200" rows="3"></textarea>
        </div>
        <div class="form-row">
          <label>表情/图标</label>
          <input name="emoji" placeholder="🎨" maxlength="4" value="🎨" />
        </div>
        <button type="submit" class="btn btn-primary">上传皮肤</button>
      </form>
    </section>

    <section class="section">
      <h3 class="section-subtitle">皮肤广场</h3>
      <div class="skin-grid" id="skinGrid">
        ${skins.length ? skins.map(renderSkinCard).join("") : '<p class="empty">还没有皮肤，来做第一个造梗王</p>'}
      </div>
    </section>
  `;

  $("#skinForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const result = createSkin({
      name: fd.get("name"),
      characterId: fd.get("characterId"),
      desc: fd.get("desc"),
      emoji: fd.get("emoji") || "🎨",
    });
    if (result.ok) {
      showToast("皮肤上传成功！等待冥界审核", "success");
      renderSkins();
    } else {
      showToast(result.reason || "上传失败", "error");
    }
  });

  bindSkinLikeEvents();
}

function renderSkinCard(s) {
  const char = CHARACTERS.find((c) => c.id === s.characterId);
  return `
    <div class="skin-card" data-skin="${s.id}">
      <div class="skin-emoji">${s.emoji || "🎨"}</div>
      <h4>${esc(s.name)}</h4>
      <p>${esc(s.desc || "")}</p>
      <div class="skin-meta">
        <span>${s.official ? "官方" : esc(s.author || "匿名")}</span>
        ${char ? `<span>${char.emoji} ${esc(char.name)}</span>` : ""}
      </div>
      <button class="btn-like" data-like="${s.id}" ${s.official ? "disabled" : ""}>
        ❤️ ${Number(s.likes) || 0}
      </button>
    </div>
  `;
}

function bindSkinLikeEvents() {
  app.querySelectorAll("[data-like]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const result = like(btn.dataset.like);
      if (result.ok) {
        btn.textContent = `❤️ ${result.likes}`;
        if (result.likes >= 100) showToast("🎉 恭喜获得「史诗级造梗王」称号！", "success");
      }
    });
  });
}

// ── 我的称号 ──

function renderProfile() {
  const profile = getProfile();
  const titles = getTitles();
  const titleList = titles.map((id) => OFFICIAL_TITLES[id]).filter(Boolean);
  const allTitles = Object.values(OFFICIAL_TITLES);

  app.innerHTML = `
    <section class="page-header">
      <h2>👤 冥界档案</h2>
      <p>你的称号与参与记录</p>
    </section>

    <section class="profile-card">
      <div class="profile-avatar">${profile.avatar || "👻"}</div>
      <div class="profile-info">
        <input class="profile-name-input" id="nicknameInput" value="${esc(profile.nickname)}" maxlength="20" />
        <small>加入冥界：${new Date(profile.joinedAt).toLocaleDateString("zh-CN")}</small>
      </div>
      <button class="btn-sm" id="saveNickname">保存</button>
    </section>

    <section class="section">
      <h3 class="section-subtitle">已获称号 (${titleList.length})</h3>
      <div class="title-grid">
        ${titleList.length ? titleList.map((t) => `
          <div class="title-badge rarity-${t.rarity}">
            <span class="title-icon">${{ common: "🪙", rare: "💎", epic: "🔥", legendary: "👑" }[t.rarity] || "🏅"}</span>
            <strong>${esc(t.name)}</strong>
            <p>${esc(t.desc)}</p>
          </div>
        `).join("") : '<p class="empty">还没有称号，快去投票、聊天、造梗吧</p>'}
      </div>
    </section>

    <section class="section">
      <h3 class="section-subtitle">全部称号一览</h3>
      <div class="title-grid locked">
        ${allTitles.map((t) => {
          const earned = titles.includes(t.id);
          return `
            <div class="title-badge rarity-${t.rarity} ${earned ? "" : "locked-badge"}">
              <span class="title-icon">${earned ? "✅" : "🔒"}</span>
              <strong>${esc(t.name)}</strong>
              <p>${esc(t.desc)}</p>
            </div>
          `;
        }).join("")}
      </div>
    </section>

    <section class="section stats">
      <div class="stat-item"><span>${getChatCount()}</span><label>对话次数</label></div>
      <div class="stat-item"><span>${getAllSkins().filter((s) => !s.official).length}</span><label>上传皮肤</label></div>
      <div class="stat-item"><span>${titles.length}</span><label>获得称号</label></div>
    </section>
  `;

  $("#saveNickname")?.addEventListener("click", () => {
    const name = $("#nicknameInput")?.value?.trim();
    if (name) {
      saveProfile({ nickname: name });
      showToast("昵称已保存", "success");
    }
  });
}

// ── 事件绑定 ──

function bindActions(root) {
  root.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.action));
  });
  root.querySelectorAll("[data-chat]").forEach((btn) => {
    btn.addEventListener("click", () => navigate("chat", { characterId: btn.dataset.chat }));
  });
}

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    const el = $("#countdownDisplay");
    if (!el) return;
    const cd = getCountdown();
    el.textContent = cd.ended
      ? (currentView === "vote" ? "投票已截止" : "已截止")
      : (currentView === "vote" ? `剩余 ${formatCountdown(cd)}` : formatCountdown(cd));
    if (cd.ended) clearInterval(countdownTimer);
  }, 1000);
}

// ── 初始化 ──

function init() {
  initStorage(CHARACTERS);

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.view));
  });

  document.querySelector(".logo")?.addEventListener("click", () => navigate("home"));

  navigate("home");
}

init();

// 暴露调试接口
window.__cyberTomb = { navigate, getLeaderboard, CHARACTERS };
