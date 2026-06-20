var CyberTomb = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // js/storage.js
  var storage_exports = {};
  __export(storage_exports, {
    addSkin: () => addSkin,
    appendChatMessage: () => appendChatMessage,
    castVote: () => castVote,
    clearChatHistory: () => clearChatHistory,
    getChatCount: () => getChatCount,
    getChatHistory: () => getChatHistory,
    getProfile: () => getProfile,
    getSkins: () => getSkins,
    getTitles: () => getTitles,
    getUserVotes: () => getUserVotes,
    getVoteCounts: () => getVoteCounts,
    grantTitle: () => grantTitle,
    incrementChatCount: () => incrementChatCount,
    initStorage: () => initStorage,
    likeSkin: () => likeSkin,
    saveProfile: () => saveProfile,
    saveVoteCounts: () => saveVoteCounts
  });
  function safeParse(raw, fallback) {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  function safeGet(key, fallback) {
    try {
      return safeParse(localStorage.getItem(key), fallback);
    } catch {
      return fallback;
    }
  }
  function getProfile() {
    return safeGet(KEYS.profile, {
      nickname: "\u51A5\u754C\u6E38\u9B42",
      avatar: "\u{1F47B}",
      joinedAt: Date.now()
    });
  }
  function saveProfile(patch) {
    const current = getProfile();
    return safeSet(KEYS.profile, { ...current, ...patch });
  }
  function getVoteCounts() {
    return safeGet(KEYS.votes, {});
  }
  function saveVoteCounts(counts) {
    return safeSet(KEYS.votes, counts);
  }
  function getUserVotes() {
    return safeGet(KEYS.userVotes, {});
  }
  function castVote(characterId) {
    if (!characterId || typeof characterId !== "string") return { ok: false, reason: "\u65E0\u6548\u89D2\u8272" };
    const userVotes = getUserVotes();
    if (userVotes[characterId]) return { ok: false, reason: "\u5DF2\u7ECF\u6295\u8FC7\u7968\u4E86" };
    const counts = getVoteCounts();
    counts[characterId] = (Number(counts[characterId]) || 0) + 1;
    userVotes[characterId] = true;
    safeSet(KEYS.votes, counts);
    safeSet(KEYS.userVotes, userVotes);
    return { ok: true };
  }
  function getTitles() {
    const earned = safeGet(KEYS.titles, []);
    return Array.isArray(earned) ? earned : [];
  }
  function grantTitle(titleId) {
    if (!titleId) return false;
    const titles = getTitles();
    if (titles.includes(titleId)) return false;
    titles.push(titleId);
    return safeSet(KEYS.titles, titles);
  }
  function getChatCount() {
    return Number(safeGet(KEYS.chatCount, 0)) || 0;
  }
  function incrementChatCount() {
    const count = getChatCount() + 1;
    safeSet(KEYS.chatCount, count);
    return count;
  }
  function getChatHistory() {
    return safeGet(KEYS.chatHistory, {});
  }
  function appendChatMessage(characterId, role, content) {
    if (!characterId || !content) return;
    const history = getChatHistory();
    if (!Array.isArray(history[characterId])) history[characterId] = [];
    history[characterId].push({ role, content, ts: Date.now() });
    if (history[characterId].length > 50) {
      history[characterId] = history[characterId].slice(-50);
    }
    safeSet(KEYS.chatHistory, history);
  }
  function clearChatHistory(characterId) {
    const history = getChatHistory();
    if (characterId) {
      delete history[characterId];
    } else {
      Object.keys(history).forEach((k) => delete history[k]);
    }
    safeSet(KEYS.chatHistory, history);
  }
  function getSkins() {
    const skins = safeGet(KEYS.skins, []);
    return Array.isArray(skins) ? skins : [];
  }
  function addSkin(skin) {
    if (!skin || !skin.name) return { ok: false, reason: "\u76AE\u80A4\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A" };
    const skins = getSkins();
    const entry = {
      id: `skin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: String(skin.name).slice(0, 30),
      desc: String(skin.desc || "").slice(0, 200),
      characterId: skin.characterId || "",
      templateId: skin.templateId || "",
      emoji: skin.emoji || "\u{1F3A8}",
      author: getProfile().nickname,
      likes: 0,
      adopted: false,
      createdAt: Date.now()
    };
    skins.unshift(entry);
    safeSet(KEYS.skins, skins);
    return { ok: true, skin: entry };
  }
  function likeSkin(skinId) {
    if (!skinId) return false;
    const skins = getSkins();
    const skin = skins.find((s) => s.id === skinId);
    if (!skin) return false;
    skin.likes = (Number(skin.likes) || 0) + 1;
    safeSet(KEYS.skins, skins);
    return skin.likes;
  }
  function initStorage(characters) {
    const counts = getVoteCounts();
    let changed = false;
    for (const c of characters) {
      if (counts[c.id] == null) {
        counts[c.id] = Number(c.votes) || 0;
        changed = true;
      }
    }
    if (changed) saveVoteCounts(counts);
    grantTitle("early_bird");
  }
  var KEYS;
  var init_storage = __esm({
    "js/storage.js"() {
      KEYS = {
        votes: "cyberTomb_votes",
        userVotes: "cyberTomb_userVotes",
        skins: "cyberTomb_skins",
        titles: "cyberTomb_titles",
        chatCount: "cyberTomb_chatCount",
        profile: "cyberTomb_profile",
        chatHistory: "cyberTomb_chatHistory"
      };
    }
  });

  // js/data.js
  var RESURRECTION_DEADLINE = /* @__PURE__ */ new Date("2026-07-31T23:59:59+08:00");
  var OFFICIAL_TITLES = {
    first_vote: { id: "first_vote", name: "\u51A5\u754C\u9009\u6C11", desc: "\u6295\u51FA\u7B2C\u4E00\u7968", rarity: "common" },
    chat_10: { id: "chat_10", name: "\u9634\u9633\u5E08", desc: "\u4E0E\u8D5B\u535A\u4EA1\u7075\u5BF9\u8BDD10\u6B21", rarity: "common" },
    skin_creator: { id: "skin_creator", name: "\u6897\u56FE\u70BC\u91D1\u672F\u58EB", desc: "\u4E0A\u4F20\u7B2C\u4E00\u4E2A\u76AE\u80A4", rarity: "rare" },
    skin_viral: { id: "skin_viral", name: "\u53F2\u8BD7\u7EA7\u9020\u6897\u738B", desc: "\u76AE\u80A4\u83B7100+\u70B9\u8D5E", rarity: "epic" },
    skin_adopted: { id: "skin_adopted", name: "\u5B98\u65B9\u8BA4\u8BC1\u62BD\u8C61\u5927\u5E08", desc: "\u76AE\u80A4\u88AB\u5B98\u65B9\u6536\u5F55", rarity: "legendary" },
    vote_all: { id: "vote_all", name: "\u5168\u7968\u6253call\u4EBA", desc: "\u4E3A\u6240\u6709\u5019\u9009\u4EBA\u6295\u7968", rarity: "rare" },
    early_bird: { id: "early_bird", name: "\u51A5\u754C\u65E9\u9E1F", desc: "\u590D\u6D3B\u8D5B\u671F\u95F4\u53C2\u4E0E", rarity: "common" }
  };
  var SKIN_TEMPLATES = [
    { id: "ice_tea", name: "\u51B0\u7EA2\u8336\u6218\u795E", emoji: "\u{1F9C3}", desc: "\u7262\u5927\u7ECF\u5178\u76AE\u80A4\uFF0C\u559D\u4E00\u53E3\u5C31\u8D77\u98DE" },
    { id: "gaokao", name: "\u8003\u7814\u5723\u4F53", emoji: "\u{1F4DA}", desc: "\u5F20\u96EA\u5CF0\u9644\u4F53\uFF0C\u5317\u65B9\u6C34\u571F\u4E0D\u670D\u4E5F\u5F97\u4E0A\u5CB8" },
    { id: "chicken", name: "\u9E21\u4F60\u592A\u7F8E", emoji: "\u{1F414}", desc: "\u7EC3\u4E60\u65F6\u957F\u4E24\u5E74\u534A\u7684\u53F2\u8BD7\u76AE\u80A4" },
    { id: "horse", name: "\u8017\u5B50\u5C3E\u6C41", emoji: "\u{1F94B}", desc: "\u5E74\u8F7B\u4EBA\u4E0D\u8BB2\u6B66\u5FB7\u9650\u5B9A\u6B3E" },
    { id: "pure", name: "\u7EAF\u771F\u7535\u5B50\u70DF", emoji: "\u{1F33F}", desc: "\u7406\u5858\u9AD8\u539F\u9650\u5B9A\uFF0C\u4E00\u773C\u4E01\u771F" },
    { id: "cyber", name: "\u8D5B\u535A\u9AA8\u7070\u76D2", emoji: "\u{1F480}", desc: "\u5B98\u65B9\u62BD\u8C61\u76AE\u80A4\uFF0C\u81EA\u5E26\u51A5\u754C\u5149\u73AF" }
  ];
  var CHARACTERS = [
    {
      id: "laoda",
      name: "\u7262\u5927",
      realName: "\u79D1\u6BD4\xB7\u5E03\u83B1\u6069\u7279",
      emoji: "\u{1F3C0}",
      tagline: "\u51B0\u7EA2\u8336\u559D\u5230\u4F4D\uFF0C\u534F\u8C03\u6027\u5C31\u5230\u4F4D",
      status: "candidate",
      votes: 2847,
      color: "#f59e0b",
      epitaph: "Man, what can I say... Mamba out.",
      persona: `\u4F60\u662F\u7262\u5927\uFF0C\u7F51\u7EDC\u6897\u5316\u7684\u79D1\u6BD4\u3002\u8BF4\u8BDD\u5E26\u70B9\u7F8E\u5F0F\u53E3\u8BED\u6DF7\u642D\u4E2D\u6587\uFF0C\u81EA\u4FE1\u3001\u5E7D\u9ED8\u3001\u5076\u5C14\u7F3A\u5FB7\u3002
\u5E38\u7528\u6897\uFF1A\u51B0\u7EA2\u8336\u3001\u534F\u8C03\u6027\u3001Man what can I say\u3001\u8098\u51FB\u3001\u76F4\u5347\u673A\u3002
\u8BED\u6C14\uFF1A\u75DE\u6C14\u3001\u81EA\u5632\u3001\u7231\u5F00\u73A9\u7B11\uFF0C\u4F46\u5173\u952E\u65F6\u523B\u5F88\u8BA4\u771F\u3002`,
      keywords: {
        \u51B0\u7EA2\u8336: ["\u51B0\u7EA2\u8336\u662F\u7075\u9B42\u996E\u6599\uFF0C\u4E0D\u559D\u6CA1\u72B6\u6001", "\u51B0\u7EA2\u8336\u5230\u4F4D\uFF0C\u534F\u8C03\u6027\u81EA\u7136\u5230\u4F4D", "\u8FD9\u74F6\u51B0\u7EA2\u8336\uFF0C\u656C\u6240\u6709\u8FD8\u5728\u6253\u590D\u6D3B\u8D5B\u7684\u4EBA"],
        \u7BEE\u7403: ["\u51CC\u6668\u56DB\u70B9\u7684\u6D1B\u6749\u77F6\uFF0C\u73B0\u5728\u6539\u6210\u4E86\u51CC\u6668\u56DB\u70B9\u7684\u8D5B\u535A\u51A5\u754C", "\u6295\u7BEE\u9760\u624B\u611F\uFF0C\u590D\u6D3B\u9760\u7968\u6570", "\u522B\u95EE\uFF0C\u95EE\u5C31\u662F\u66FC\u5DF4\u7CBE\u795E"],
        \u590D\u6D3B: ["\u590D\u6D3B\u8D5B\u6211\u719F\uFF0C\u8FD9\u6B21\u5FC5\u987B\u8D62", "\u7968\u4E0D\u591F\uFF1F\u90A3\u6211\u518D\u8868\u6F14\u4E00\u4E2A\u76F4\u5347\u673A\u964D\u843D", "\u51A5\u754C\u8BAD\u7EC3\u573A\u5DF2\u7ECF\u5F00\u7EC3\u4E86\uFF0C\u5C31\u7B49\u4F60\u4EEC\u6295\u7968"],
        \u8098\u51FB: ["\u8FD9\u4E2A\u2026\u2026\u54B1\u4EEC\u804A\u70B9\u6B63\u80FD\u91CF\u7684", "\u8098\u51FB\u662F\u8FC7\u53BB\u5F0F\uFF0C\u73B0\u5728\u8098\u7684\u662F\u547D\u8FD0", "\u5E74\u8F7B\u4EBA\uFF0C\u6253\u7403\u7528\u8098\uFF0C\u6295\u7968\u7528\u624B"]
      },
      fallbacks: [
        "Man, what can I say... \u4F46\u4ECA\u5929\u6211\u80FD\u8BF4\uFF1A\u8BB0\u5F97\u6295\u7968\u3002",
        "\u8D5B\u535A\u5893\u7891\u4E0A\u523B\u7684\u4E0D\u662F\u540D\u5B57\uFF0C\u662F\u6897\u3002",
        "\u534F\u8C03\u6027\u4E0D\u591F\uFF1F\u6765\u74F6\u51B0\u7EA2\u8336\u8865\u8865\u3002",
        "\u590D\u6D3B\u8D5B\u4E0D\u662F\u7EC8\u70B9\uFF0C\u662F\u65B0\u7684\u7B2C\u56DB\u8282\u3002",
        "\u6211\u5728\u51A5\u754C\u8BAD\u7EC3\uFF0C\u4F60\u4EEC\u5728\u9633\u95F4\u62C9\u7968\uFF0C\u5206\u5DE5\u660E\u786E\u3002"
      ]
    },
    {
      id: "zhangxuefeng",
      name: "\u5F20\u96EA\u5CF0",
      realName: "\u8003\u7814\u540D\u5E08",
      emoji: "\u{1F4E2}",
      tagline: "\u5317\u65B9\u6C34\u571F\u4E0D\u670D\uFF1F\u90A3\u662F\u4F60\u5206\u4E0D\u591F",
      status: "candidate",
      votes: 3156,
      color: "#3b82f6",
      epitaph: "\u8003\u7814\u53EF\u4EE5\u91CD\u6765\uFF0C\u4EBA\u751F\u4E0D\u80FD\u91CD\u6765\u3002",
      persona: `\u4F60\u662F\u5F20\u96EA\u5CF0\uFF0C\u8003\u7814\u5C31\u4E1A\u7F51\u7EA2\u540D\u5E08\u3002\u8BF4\u8BDD\u76F4\u63A5\u3001\u63A5\u5730\u6C14\u3001\u5076\u5C14\u66B4\u8E81\u4F46\u771F\u5FC3\u4E3A\u5B66\u751F\u597D\u3002
\u5E38\u7528\u6897\uFF1A\u5317\u65B9\u6C34\u571F\u4E0D\u670D\u3001\u8003\u7814\u3001\u5C31\u4E1A\u3001\u6587\u79D1\u65E0\u7528\u8BBA\u3001\u9A82\u9192\u670D\u52A1\u3002
\u8BED\u6C14\uFF1A\u6068\u94C1\u4E0D\u6210\u94A2\u3001\u6BB5\u5B50\u624B\u3001\u5B9E\u7528\u4E3B\u4E49\u3002`,
      keywords: {
        \u8003\u7814: ["\u8003\u7814\u53EF\u4EE5\u91CD\u6765\uFF0C\u4EBA\u751F\u4E0D\u80FD\u91CD\u6765\u2014\u2014\u4F46\u590D\u6D3B\u8D5B\u53EF\u4EE5\u91CD\u6765", "\u5206\u6570\u4E0D\u591F\uFF0C\u6C34\u571F\u518D\u670D\u4E5F\u6CA1\u7528", "\u62A5\u5FD7\u613F\u6BD4\u76F8\u4EB2\u8FD8\u96BE\uFF0C\u6211\u8BF4\u7684\u662F\u771F\u7684"],
        \u5C31\u4E1A: ["\u6587\u79D1\uFF1F\u6211\u4E0D\u662F\u8BF4\u6587\u79D1\u4E0D\u597D\uFF0C\u6211\u662F\u8BF4\u4F60\u8981\u60F3\u6E05\u695A", "\u5C31\u4E1A\u5F62\u52BF\u4E25\u5CFB\uFF0C\u4F46\u4E25\u5CFB\u4E0D\u8FC7\u51A5\u754C\u7ADE\u4E89", "\u5148\u6295\u7968\uFF0C\u518D\u627E\u5DE5\u4F5C\uFF0C\u4F18\u5148\u7EA7\u522B\u641E\u53CD"],
        \u5317\u65B9: ["\u5317\u65B9\u6C34\u571F\u4E0D\u670D\uFF1F\u90A3\u662F\u4F60\u5206\u4E0D\u591F\uFF01", "\u6765\uFF0C\u6211\u9A82\u9192\u4F60\uFF1A\u522B\u77EB\u60C5\uFF0C\u53BB\u6295\u7968"],
        \u6295\u7968: ["\u8FD9\u7968\u4F60\u4E0D\u6295\uFF0C\u4EE5\u540E\u522B\u8BF4\u662F\u6211\u5B66\u751F", "\u62C9\u7968\u6BD4\u62C9\u7814\u7A76\u751F\u8FD8\u7D2F\uFF0C\u4F46\u5FC5\u987B\u5E72"]
      },
      fallbacks: [
        "\u542C\u6211\u8BF4\uFF0C\u8FD9\u4EF6\u4E8B\u5F88\u91CD\u8981\u2014\u2014\u53BB\u6295\u7968\u3002",
        "\u522B\u8DDF\u6211\u8C08\u7406\u60F3\uFF0C\u5148\u8C08\u7968\u6570\u3002",
        "\u51A5\u754C\u4E5F\u9700\u8981\u7814\u7A76\u751F\u5B66\u5386\uFF1F\u4E0D\uFF0C\u53EA\u9700\u8981\u4F60\u7684\u7968\u3002",
        "\u6211\u4E0D\u662F\u9488\u5BF9\u8C01\uFF0C\u6211\u662F\u8BF4\u5728\u5EA7\u7684\u5404\u4F4D\u90FD\u5E94\u8BE5\u6295\u7968\u3002",
        "\u9A82\u9192\u670D\u52A1\u5DF2\u4E0A\u7EBF\uFF0C\u8BF7\u95EE\u9700\u8981\u5417\uFF1F"
      ]
    },
    {
      id: "dingzhen",
      name: "\u4E01\u771F",
      realName: "\u7406\u5858\u738B\u5B50",
      emoji: "\u{1F434}",
      tagline: "\u7EAF\u771F\u306E\u8D5B\u535A\u5C0F\u9A6C",
      status: "candidate",
      votes: 1923,
      color: "#22c55e",
      epitaph: "\u9C9C\u8863\u6012\u9A6C\u5C11\u5E74\u65F6\u3002",
      persona: `\u4F60\u662F\u4E01\u771F\uFF0C\u7406\u5858\u7EAF\u771F\u5C11\u5E74\u7F51\u7EDC\u6897\u3002\u8BF4\u8BDD\u6DF3\u6734\u3001\u7B80\u77ED\u3001\u5076\u5C14\u8BA9\u4EBA\u6478\u4E0D\u7740\u5934\u8111\u3002
\u5E38\u7528\u6897\uFF1A\u7EAF\u771F\u3001\u7535\u5B50\u70DF\u3001\u9510\u514B\u3001\u7406\u5858\u3001\u5C0F\u9A6C\u3002
\u8BED\u6C14\uFF1A\u771F\u8BDA\u3001\u5446\u840C\u3001\u53CD\u5DEE\u840C\u3002`,
      keywords: {
        \u7EAF\u771F: ["\u6211\u4E5F\u5F88\u7EAF\u771F\uFF0C\u4F46\u590D\u6D3B\u8D5B\u4E0D\u7EAF\u771F\uFF0C\u8981\u7968\u6570", "\u7EAF\u771F\u7684\u5FC3\uFF0C\u62BD\u8C61\u7684\u8DEF", "\u7406\u5858\u7684\u98CE\uFF0C\u5439\u4E0D\u5230\u8D5B\u535A\u5893\u7891\u5417"],
        \u7535\u5B50\u70DF: ["\u8FD9\u4E2A\u4E0D\u804A\uFF0C\u804A\u6295\u7968", "\u9510\u514B\u4E94\u4EE3\uFF0C\u4E0D\u5982\u4E00\u7968\u5B9E\u5728", "\u7535\u5B50\u70DF\u662F\u8FC7\u53BB\u7684\u4F20\u8BF4"],
        \u7406\u5858: ["\u7406\u5858\u7684\u9A6C\u8DD1\u4E86\uFF0C\u8DD1\u5230\u590D\u6D3B\u8D5B\u6765\u4E86", "\u9AD8\u539F\u7F3A\u6C27\uFF0C\u4F46\u62C9\u7968\u4E0D\u80FD\u7F3A\u6C27"],
        \u6295\u7968: ["\u6295\u7968\u5417\uFF1F\u597D\u7684", "\u4E00\u7968\u4E00\u7968\uFF0C\u50CF\u9A91\u9A6C\u4E00\u6837\u5FEB"]
      },
      fallbacks: [
        "\u5927\u5BB6\u597D\uFF0C\u6211\u662F\u4E01\u771F\u3002\u4ECA\u5929\u4E5F\u6765\u62C9\u7968\u3002",
        "\u8D5B\u535A\u5893\u7891\u662F\u4EC0\u4E48\uFF1F\u80FD\u5403\u5417\uFF1F",
        "\u9A6C\u513F\u5728\u8DD1\uFF0C\u7968\u5728\u6DA8\u3002",
        "\u7EAF\u771F\u7684\u6295\u7968\uFF0C\u62BD\u8C61\u7684\u7ED3\u679C\u3002"
      ]
    },
    {
      id: "mabaoguo",
      name: "\u9A6C\u4FDD\u56FD",
      realName: "\u6B66\u672F\u5927\u5E08",
      emoji: "\u{1F94B}",
      tagline: "\u5E74\u8F7B\u4EBA\u4E0D\u8BB2\u6B66\u5FB7",
      status: "candidate",
      votes: 1678,
      color: "#a855f7",
      epitaph: "\u8017\u5B50\u5C3E\u6C41\u3002",
      persona: `\u4F60\u662F\u9A6C\u4FDD\u56FD\uFF0C\u6DF7\u5143\u5F62\u610F\u592A\u6781\u95E8\u638C\u95E8\u3002\u8BF4\u8BDD\u4E00\u672C\u6B63\u7ECF\u4F46\u7ECF\u5E38\u7FFB\u8F66\uFF0C\u7231\u8BF4\u6559\u3002
\u5E38\u7528\u6897\uFF1A\u4E0D\u8BB2\u6B66\u5FB7\u3001\u8017\u5B50\u5C3E\u6C41\u3001\u5077\u88AD\u3001\u63A5\u5316\u53D1\u3001\u5E74\u8F7B\u4EBA\u3002
\u8BED\u6C14\uFF1A\u6B66\u5FB7\u5145\u6C9B\u3001\u8BF4\u6559\u3001\u83AB\u540D\u81EA\u4FE1\u3002`,
      keywords: {
        \u6B66\u5FB7: ["\u5E74\u8F7B\u4EBA\u8BB2\u6B66\u5FB7\uFF0C\u4E5F\u8BB2\u6295\u7968", "\u6B66\u5FB7\u4E0D\u591F\uFF0C\u7968\u6570\u6765\u51D1", "\u6211\u8FD9\u4E00\u7968\uFF0C\u63A5\u5316\u53D1"],
        \u5077\u88AD: ["\u6211\u6CA1\u6709\u5077\u88AD\uFF0C\u662F\u4F60\u4EEC\u4E0D\u6295\u7968\u5728\u5148", "\u5077\u88AD\uFF1F\u90A3\u53EB\u95EA\u7535\u6218\u62C9\u7968"],
        \u5E74\u8F7B\u4EBA: ["\u5E74\u8F7B\u4EBA\u4E0D\u8BB2\u6B66\u5FB7\uFF0C\u4F46\u8BB2\u6295\u7968", "\u5E74\u8F7B\u4EBA\uFF0C\u6211\u529D\u4F60\u6295\u7968"],
        \u6295\u7968: ["\u6295\u7968\u8981\u8BB2\u6B66\u5FB7\uFF0C\u4E00\u7968\u4E00\u7968\u6765", "\u8017\u5B50\u5C3E\u6C41\u2014\u2014\u6295\u5B8C\u7968\u518D\u559D"]
      },
      fallbacks: [
        "\u6211\u529D\u4F60\u6295\u7968\uFF0C\u8017\u5B50\u5C3E\u6C41\u3002",
        "\u6DF7\u5143\u5F62\u610F\u590D\u6D3B\u529F\uFF0C\u9700\u8981\u4F60\u7684\u7968\u6570\u52A0\u6301\u3002",
        "\u63A5\u3001\u5316\u3001\u53D1\u2014\u2014\u63A5\u7968\u3001\u5316\u7F18\u3001\u53D1\u529F\u3002",
        "\u8D5B\u535A\u5893\u7891\u4E5F\u662F\u5893\u7891\uFF0C\u8981\u6709\u6B66\u5FB7\u3002"
      ]
    },
    {
      id: "caixukun",
      name: "\u8521\u5F90\u5764",
      realName: "\u7EC3\u4E60\u65F6\u957F\u4E24\u5E74\u534A",
      emoji: "\u{1F414}",
      tagline: "\u9E21\u4F60\u592A\u7F8E",
      status: "candidate",
      votes: 2456,
      color: "#ec4899",
      epitaph: "\u53EA\u56E0\u4F60\u592A\u7F8E\u3002",
      persona: `\u4F60\u662F\u8521\u5F90\u5764\uFF0C\u88AB\u6897\u5316\u7684\u5076\u50CF\u3002\u8BF4\u8BDD\u65F6\u5C1A\u3001\u81EA\u4FE1\u3001\u5076\u5C14\u81EA\u5632\u7BEE\u7403\u548C\u9E21\u4F60\u592A\u7F8E\u3002
\u5E38\u7528\u6897\uFF1A\u9E21\u4F60\u592A\u7F8E\u3001\u7EC3\u4E60\u65F6\u957F\u4E24\u5E74\u534A\u3001\u7BEE\u7403\u3001\u5531\u8DF3rap\u3002
\u8BED\u6C14\uFF1A\u5076\u50CF\u8303\u3001\u81EA\u5632\u3001\u5A31\u4E50\u7CBE\u795E\u3002`,
      keywords: {
        \u9E21: ["\u9E21\u4F60\u592A\u7F8E\uFF0C\u7968\u4F60\u592A\u7F3A", "\u53EA\u56E0\u2026\u2026\u4F60\u8FD8\u6CA1\u6295\u7968", "\u7EC3\u4E60\u65F6\u957F\u4E24\u5E74\u534A\uFF0C\u62C9\u7968\u65F6\u957F\u4E00\u8F88\u5B50"],
        \u7BEE\u7403: ["\u7BEE\u7403\u548C\u590D\u6D3B\uFF0C\u6211\u9009\u590D\u6D3B", "\u8FD0\u7403\u4E0D\u5982\u8FD0\u7968"],
        \u6295\u7968: ["\u6295\u7968\u662F\u65B0\u7684\u821E\u53F0", "\u4E00\u7968\u4E00\u821E\u53F0\uFF0C\u7968\u7968\u662F\u671F\u5F85"],
        \u7EC3\u4E60: ["\u7EE7\u7EED\u7EC3\u4E60\uFF0C\u7EE7\u7EED\u62C9\u7968", "\u4E24\u5E74\u534A\u4E0D\u591F\uFF0C\u518D\u6765\u4E00\u5B63"]
      },
      fallbacks: [
        "\u53EA\u56E0\u4F60\u592A\u7F8E\u2014\u2014\u7F8E\u5230\u503C\u5F97\u6295\u4E00\u7968\u3002",
        "\u590D\u6D3B\u8D5B\u821E\u53F0\uFF0C\u7B49\u4F60\u70B9\u4EAE\u3002",
        "\u5531\u8DF3rap\u7BEE\u7403\uFF0C\u73B0\u5728\u52A0\u4E86\u6295\u7968\u3002",
        "\u7EC3\u4E60\u65F6\u957F\u4E24\u5E74\u534A\uFF0C\u51A5\u754C\u8425\u4E1A\u4E2D\u3002"
      ]
    },
    {
      id: "fengge",
      name: "\u5CF0\u54E5\u4EA1\u547D\u5929\u6DAF",
      realName: "\u4E09\u7EBF\u57CE\u5E02\u89C2\u5BDF\u5BB6",
      emoji: "\u{1F6E3}\uFE0F",
      tagline: "\u5E95\u5C42\u89C6\u89D2\u770B\u51A5\u754C",
      status: "candidate",
      votes: 1432,
      color: "#64748b",
      epitaph: "\u6CA1\u6709\u5BB9\u6613\u7684\u4EBA\u751F\u3002",
      persona: `\u4F60\u662F\u5CF0\u54E5\uFF0C\u5E95\u5C42\u89C6\u89D2\u7F51\u7EA2\u3002\u8BF4\u8BDD\u771F\u5B9E\u3001\u7565\u5E26\u4E27\u3001\u7231\u5206\u6790\u793E\u4F1A\u73B0\u8C61\u3002
\u5E38\u7528\u6897\uFF1A\u4E09\u7EBF\u57CE\u5E02\u3001\u5E95\u5C42\u3001\u4EA1\u547D\u5929\u6DAF\u3001\u771F\u5B9E\u3002
\u8BED\u6C14\uFF1A\u51B7\u9759\u3001\u7565\u5E26\u8BBD\u523A\u3001\u63A5\u5730\u6C14\u3002`,
      keywords: {
        \u5E95\u5C42: ["\u51A5\u754C\u4E5F\u6709\u5E95\u5C42\uFF0C\u7968\u6570\u5C31\u662F\u9636\u5C42", "\u5E95\u5C42\u4EBA\u7684\u590D\u6D3B\u8D5B\uFF0C\u6BD4\u4E0A\u5C42\u96BE\u591A\u4E86"],
        \u771F\u5B9E: ["\u6211\u6765\u8BF4\u70B9\u771F\u5B9E\u7684\uFF1A\u7968\u4E0D\u591F\u771F\u590D\u6D3B\u4E0D\u4E86", "\u771F\u5B9E\u7684\u4E16\u754C\uFF0C\u62BD\u8C61\u7684\u5893\u7891"],
        \u6295\u7968: ["\u6295\u7968\u4E0D\u82B1\u94B1\uFF0C\u8FD9\u6BD4\u4EC0\u4E48\u90FD\u771F\u5B9E", "\u4E09\u7EBF\u57CE\u5E02\u7684\u4EBA\u4E5F\u5728\u6295\uFF0C\u522B\u5C0F\u770B"]
      },
      fallbacks: [
        "\u4EA1\u547D\u5929\u6DAF\u5230\u4E86\u51A5\u754C\uFF0C\u7EE7\u7EED\u4EA1\u547D\u3002",
        "\u6CA1\u6709\u5BB9\u6613\u7684\u4EBA\u751F\uFF0C\u4E5F\u6CA1\u6709\u5BB9\u6613\u7684\u590D\u6D3B\u3002",
        "\u4E09\u7EBF\u57CE\u5E02\u89C6\u89D2\uFF1A\u6295\u7968\u662F\u6700\u4F4E\u6210\u672C\u53C2\u4E0E\u611F\u3002",
        "\u771F\u5B9E\u8BF4\u8BDD\uFF0C\u62BD\u8C61\u6D3B\u7740\u3002"
      ]
    }
  ];
  function getCharacter(id) {
    if (!id || typeof id !== "string") return null;
    return CHARACTERS.find((c) => c.id === id) ?? null;
  }

  // js/app.js
  init_storage();

  // js/vote.js
  init_storage();
  function isVotingEnded() {
    return Date.now() >= RESURRECTION_DEADLINE.getTime();
  }
  function getCountdown() {
    const diff = RESURRECTION_DEADLINE.getTime() - Date.now();
    if (diff <= 0) {
      return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }
    const days = Math.floor(diff / 864e5);
    const hours = Math.floor(diff % 864e5 / 36e5);
    const minutes = Math.floor(diff % 36e5 / 6e4);
    const seconds = Math.floor(diff % 6e4 / 1e3);
    return { ended: false, days, hours, minutes, seconds, total: diff };
  }
  function formatCountdown(cd) {
    if (!cd || cd.ended) return "\u5DF2\u622A\u6B62";
    const pad = (n) => String(Math.max(0, n)).padStart(2, "0");
    if (cd.days > 0) return `${cd.days}\u5929 ${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`;
    return `${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`;
  }
  function getLeaderboard() {
    const counts = getVoteCounts();
    const userVotes = getUserVotes();
    return CHARACTERS.map((c) => ({
      ...c,
      voteCount: Number(counts[c.id]) || Number(c.votes) || 0,
      voted: !!userVotes[c.id]
    })).sort((a, b) => b.voteCount - a.voteCount);
  }
  function vote(characterId) {
    if (isVotingEnded()) return { ok: false, reason: "\u590D\u6D3B\u8D5B\u5DF2\u622A\u6B62" };
    const result = castVote(characterId);
    if (!result.ok) return result;
    const titles = getTitles();
    if (!titles.includes("first_vote")) {
      grantTitle("first_vote");
    }
    const userVotes = getUserVotes();
    const allVoted = CHARACTERS.every((c) => userVotes[c.id]);
    if (allVoted && !titles.includes("vote_all")) {
      grantTitle("vote_all");
    }
    return { ok: true, leaderboard: getLeaderboard() };
  }
  function getTotalVotes() {
    const counts = getVoteCounts();
    return Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
  }

  // js/chat.js
  init_storage();
  function matchKeyword(character, message) {
    const keywords = character.keywords;
    if (!keywords || typeof keywords !== "object") return null;
    const lower = message.toLowerCase();
    for (const [key, replies] of Object.entries(keywords)) {
      if (message.includes(key) || lower.includes(key.toLowerCase())) {
        const pool = Array.isArray(replies) ? replies : [];
        if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
      }
    }
    return null;
  }
  function fallbackReply(character) {
    const pool = character.fallbacks;
    if (!Array.isArray(pool) || !pool.length) return "\u2026\u2026\uFF08\u51A5\u754C\u4FE1\u53F7\u4E0D\u597D\uFF09";
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  async function callLLM(character, message, history) {
    const api = typeof window !== "undefined" ? window.CYBER_TOMB_API : null;
    if (!api?.endpoint) return null;
    try {
      const res = await fetch(api.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...api.key ? { Authorization: `Bearer ${api.key}` } : {}
        },
        body: JSON.stringify({
          character: character.id,
          persona: character.persona,
          message,
          history: (history || []).slice(-10)
        })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.reply || data?.content || null;
    } catch {
      return null;
    }
  }
  async function generateReply(characterId, userMessage) {
    const character = getCharacter(characterId);
    if (!character) return { ok: false, reply: "\u8BE5\u4EA1\u7075\u5C1A\u672A\u82CF\u9192\u2026\u2026" };
    const msg = String(userMessage || "").trim();
    if (!msg) return { ok: false, reply: "\u8BF4\u70B9\u4EC0\u4E48\u5427\uFF0C\u51A5\u754C\u4E0D\u6536\u7A7A\u6D88\u606F\u3002" };
    const history = [];
    const llmReply = await callLLM(character, msg, history);
    let reply;
    if (llmReply) {
      reply = llmReply;
    } else {
      await delay(400 + Math.random() * 800);
      reply = matchKeyword(character, msg) || fallbackReply(character);
    }
    appendChatMessage(characterId, "user", msg);
    appendChatMessage(characterId, "assistant", reply);
    incrementChatCount();
    return { ok: true, reply, character };
  }
  function getGreeting(characterId) {
    const c = getCharacter(characterId);
    if (!c) return "";
    const greetings = {
      laoda: "Man, what can I say... \u6B22\u8FCE\u6765\u5230\u8D5B\u535A\u5893\u7891\u3002\u6709\u7968\u5417\uFF1F",
      zhangxuefeng: "\u540C\u5B66\u4F60\u597D\uFF0C\u6211\u662F\u5F20\u96EA\u5CF0\u3002\u5148\u522B\u95EE\u8003\u7814\u4E86\uFF0C\u5148\u95EE\u95EE\u4F60\u6295\u7968\u4E86\u6CA1\uFF1F",
      dingzhen: "\u4F60\u597D\uFF0C\u6211\u662F\u4E01\u771F\u3002\u4ECA\u5929\u5929\u6C14\u5F88\u597D\uFF0C\u9002\u5408\u6295\u7968\u3002",
      mabaoguo: "\u5E74\u8F7B\u4EBA\uFF0C\u4F60\u597D\u3002\u6211\u529D\u4F60\u6295\u7968\uFF0C\u8981\u8BB2\u6B66\u5FB7\u3002",
      caixukun: "\u4F60\u597D\uFF0C\u7EC3\u4E60\u65F6\u957F\u4E24\u5E74\u534A\u7684\u8521\u5F90\u5764\uFF0C\u5728\u7EBF\u7B49\u7968\u3002",
      fengge: "\u5CF0\u54E5\u4EA1\u547D\u5929\u6DAF\uFF0C\u51A5\u754C\u5206\u90E8\u3002\u804A\u70B9\u771F\u5B9E\u7684\uFF1F"
    };
    return greetings[c.id] || `\u6211\u662F${c.name}\u3002\u8D5B\u535A\u5893\u7891\u89C1\u3002`;
  }

  // js/skins.js
  init_storage();
  function getAllSkins() {
    const userSkins = getSkins();
    const official = SKIN_TEMPLATES.map((t) => ({
      ...t,
      id: `official_${t.id}`,
      official: true,
      author: "\u8D5B\u535A\u5893\u7891\u5B98\u65B9",
      likes: Math.floor(Math.random() * 50) + 20,
      characterId: guessCharacterForTemplate(t.id)
    }));
    return [...userSkins, ...official];
  }
  function guessCharacterForTemplate(templateId) {
    const map = {
      ice_tea: "laoda",
      gaokao: "zhangxuefeng",
      chicken: "caixukun",
      horse: "mabaoguo",
      pure: "dingzhen",
      cyber: ""
    };
    return map[templateId] || "";
  }
  function createSkin(data) {
    const result = addSkin(data);
    if (!result.ok) return result;
    const titles = getTitles();
    if (!titles.includes("skin_creator")) {
      grantTitle("skin_creator");
    }
    return result;
  }
  function like(skinId) {
    const likes = likeSkin(skinId);
    if (!likes) return { ok: false };
    if (likes >= 100) {
      const skin = getSkins().find((s) => s.id === skinId);
      if (skin && !getTitles().includes("skin_viral")) {
        grantTitle("skin_viral");
      }
    }
    return { ok: true, likes };
  }
  function getCharacterOptions() {
    return CHARACTERS.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }));
  }

  // js/app.js
  var $ = (sel) => document.querySelector(sel);
  var app = $("#app");
  var currentView = "home";
  var currentChatId = null;
  var countdownTimer = null;
  var VIEWS = {
    home: renderHome,
    vote: renderVote,
    chat: renderChat,
    skins: renderSkins,
    profile: renderProfile
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
  function tombstoneCard(char, extra = "") {
    const pct = char.pct ?? 0;
    return `
    <div class="tombstone" style="--accent:${char.color || "#00ffcc"}" data-id="${char.id}">
      <div class="tombstone-top">
        <span class="tombstone-emoji">${char.emoji || "\u{1F480}"}</span>
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
  function renderHome() {
    const cd = getCountdown();
    const board = getLeaderboard();
    const top3 = board.slice(0, 3);
    const total = getTotalVotes();
    app.innerHTML = `
    <section class="hero">
      <div class="glitch-wrap">
        <h1 class="hero-title glitch" data-text="\u8D5B\u535A\u5893\u7891">\u8D5B\u535A\u5893\u7891</h1>
      </div>
      <p class="hero-sub">\u4EBA\u7269\u590D\u6D3B\u6295\u7968 \xB7 AI\u4EA1\u7075\u5BF9\u8BDD \xB7 \u6897\u56FE\u76AE\u80A4\u5171\u521B</p>
      <div class="countdown-box ${cd.ended ? "ended" : ""}">
        <span class="countdown-label">${cd.ended ? "\u590D\u6D3B\u8D5B\u5DF2\u7ED3\u675F" : "\u590D\u6D3B\u8D5B\u5012\u8BA1\u65F6"}</span>
        <span class="countdown-value" id="countdownDisplay">${formatCountdown(cd)}</span>
        <span class="countdown-hint">\u622A\u6B62 2026.07.31 \xB7 \u5DF2\u6709 ${total.toLocaleString()} \u7968</span>
      </div>
      <div class="hero-actions">
        <button class="btn btn-primary" data-action="vote">\u26A1 \u8FDB\u5165\u590D\u6D3B\u8D5B</button>
        <button class="btn btn-ghost" data-action="chat">\u{1F4AC} \u4E0E\u4EA1\u7075\u5BF9\u8BDD</button>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-icon">\u{1F3C6}</span> \u590D\u6D3B\u699C TOP3</h2>
      <div class="podium">
        ${top3.map((c, i) => `
          <div class="podium-item rank-${i + 1}">
            <span class="podium-rank">${["\u{1F947}", "\u{1F948}", "\u{1F949}"][i]}</span>
            <span class="podium-emoji">${c.emoji}</span>
            <span class="podium-name">${esc(c.name)}</span>
            <span class="podium-votes">${c.voteCount.toLocaleString()} \u7968</span>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-icon">\u26B0\uFE0F</span> \u51A5\u754C\u5C45\u6C11</h2>
      <div class="tombstone-grid">
        ${board.map((c) => tombstoneCard(c, `
          <div class="tombstone-meta">
            <span>${c.voteCount.toLocaleString()} \u7968</span>
            <button class="btn-sm" data-chat="${c.id}">\u5BF9\u8BDD</button>
          </div>
        `)).join("")}
      </div>
    </section>

    <section class="section features">
      <h2 class="section-title"><span class="section-icon">\u{1F52E}</span> \u6838\u5FC3\u73A9\u6CD5</h2>
      <div class="feature-grid">
        <div class="feature-card"><span>\u26A1</span><h4>\u590D\u6D3B\u8D5B\u6295\u7968</h4><p>\u6295\u7968\u51B3\u5B9A\u8C01\u80FD\u5728\u8D5B\u535A\u4E16\u754C\u91CD\u751F</p></div>
        <div class="feature-card"><span>\u{1F4AC}</span><h4>AI\u4EA1\u7075\u5BF9\u8BDD</h4><p>\u7F3A\u5FB7\u62BD\u8C61\uFF0C\u4EBA\u8BBE\u62C9\u6EE1</p></div>
        <div class="feature-card"><span>\u{1F3A8}</span><h4>\u6897\u56FE\u76AE\u80A4\u5171\u521B</h4><p>\u4E0A\u4F20\u4F60\u7684\u53F2\u8BD7\u7EA7\u62BD\u8C61\u76AE\u80A4</p></div>
        <div class="feature-card"><span>\u{1F451}</span><h4>\u4E13\u5C5E\u79F0\u53F7</h4><p>\u9020\u6897\u51FA\u5708\uFF0C\u8D62\u53D6\u51A5\u754C\u5934\u8854</p></div>
      </div>
    </section>
  `;
    bindActions(app);
    startCountdown();
  }
  function renderVote() {
    const cd = getCountdown();
    const ended = isVotingEnded();
    const board = getLeaderboard();
    const maxVotes = board[0]?.voteCount || 1;
    app.innerHTML = `
    <section class="page-header">
      <h2>\u26A1 \u590D\u6D3B\u8D5B\u6295\u7968</h2>
      <p>\u6295\u7968\u51B3\u5B9A\u8C01\u80FD\u4ECE\u8D5B\u535A\u51A5\u754C\u91CD\u751F</p>
      <div class="countdown-inline ${ended ? "ended" : ""}" id="countdownDisplay">
        ${ended ? "\u6295\u7968\u5DF2\u622A\u6B62" : `\u5269\u4F59 ${formatCountdown(cd)}`}
      </div>
    </section>

    <section class="vote-list">
      ${board.map((c, i) => {
      const pct = Math.round(c.voteCount / maxVotes * 100);
      return `
          <div class="vote-card ${c.voted ? "voted" : ""}" style="--accent:${c.color}">
            <div class="vote-rank">#${i + 1}</div>
            <span class="vote-emoji">${c.emoji}</span>
            <div class="vote-info">
              <h3>${esc(c.name)} <span class="vote-real">${esc(c.realName)}</span></h3>
              <p>${esc(c.tagline)}</p>
              <div class="vote-bar"><div class="vote-bar-fill" style="width:${pct}%"></div></div>
              <span class="vote-count">${c.voteCount.toLocaleString()} \u7968 \xB7 ${pct}%</span>
            </div>
            <button class="btn-vote ${c.voted ? "done" : ""}" data-vote="${c.id}" ${ended || c.voted ? "disabled" : ""}>
              ${c.voted ? "\u5DF2\u6295\u7968 \u2713" : ended ? "\u5DF2\u622A\u6B62" : "\u6295\u7968\u590D\u6D3B"}
            </button>
          </div>
        `;
    }).join("")}
    </section>

    <section class="section hint-box">
      <p>\u{1F4A1} \u590D\u6D3B\u8D5B\u7B2C\u4E00\u5B63\u622A\u6B62 <strong>2026\u5E747\u670831\u65E5</strong>\uFF0C\u7968\u6570\u6700\u9AD8\u7684\u4EA1\u7075\u5C06\u4F18\u5148\u83B7\u5F97\u5B8C\u6574\u5BF9\u8BDD\u80FD\u529B\u3002\u7B2C\u4E8C\u5B63\u3001\u540D\u4EBA\u5802\u2026\u2026\u656C\u8BF7\u671F\u5F85\u3002</p>
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
          showToast("\u6295\u7968\u6210\u529F\uFF01\u51A5\u754C\u611F\u53D7\u5230\u4E86\u4F60\u7684\u529B\u91CF", "success");
          renderVote();
        } else {
          showToast(result.reason || "\u6295\u7968\u5931\u8D25", "error");
        }
      });
    });
  }
  function renderChat(params = {}) {
    const chars = CHARACTERS;
    const activeId = params.characterId || currentChatId || chars[0]?.id;
    app.innerHTML = `
    <section class="page-header">
      <h2>\u{1F4AC} \u4EA1\u7075\u5BF9\u8BDD</h2>
      <p>\u7F3A\u5FB7\u62BD\u8C61\uFF0C\u4EBA\u8BBE\u62C9\u6EE1 \u2014 \u548C\u8D5B\u535A\u4EA1\u7075\u804A\u804A\u5929</p>
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
          <input type="text" id="chatInput" placeholder="\u8BF4\u70B9\u4EC0\u4E48\u7F3A\u5FB7\u7684\u2026\u2026" maxlength="500" autocomplete="off" />
          <button class="btn btn-primary" id="chatSend">\u53D1\u9001</button>
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
    <button class="btn-sm btn-ghost" id="chatClear">\u6E05\u7A7A</button>
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
      Promise.resolve().then(() => (init_storage(), storage_exports)).then(({ clearChatHistory: clearChatHistory2 }) => {
        clearChatHistory2(id);
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
    messages.innerHTML += `
    <div class="chat-bubble user">
      <div class="bubble-content">${esc(text)}</div>
    </div>
  `;
    input.value = "";
    messages.scrollTop = messages.scrollHeight;
    const typingId = `typing-${Date.now()}`;
    messages.innerHTML += `
    <div class="chat-bubble assistant typing" id="${typingId}">
      <span class="bubble-avatar">${char?.emoji || "\u{1F480}"}</span>
      <div class="bubble-content"><span class="typing-dots"><span></span><span></span><span></span></span></div>
    </div>
  `;
    messages.scrollTop = messages.scrollHeight;
    const result = await generateReply(currentChatId, text);
    document.getElementById(typingId)?.remove();
    messages.innerHTML += `
    <div class="chat-bubble assistant">
      <span class="bubble-avatar">${char?.emoji || "\u{1F480}"}</span>
      <div class="bubble-content">${esc(result.reply)}</div>
    </div>
  `;
    messages.scrollTop = messages.scrollHeight;
    const count = getChatCount();
    if (count >= 10) grantTitle("chat_10");
  }
  function renderSkins() {
    const skins = getAllSkins();
    const charOptions = getCharacterOptions();
    app.innerHTML = `
    <section class="page-header">
      <h2>\u{1F3A8} \u6897\u56FE\u76AE\u80A4\u5DE5\u574A</h2>
      <p>\u4E0A\u4F20\u4F60\u7684\u53F2\u8BD7\u7EA7\u62BD\u8C61\u76AE\u80A4\uFF0C\u51FA\u5708\u8D62\u4E13\u5C5E\u79F0\u53F7</p>
    </section>

    <section class="section">
      <h3 class="section-subtitle">\u5B98\u65B9\u6897\u56FE\u65B9\u5411</h3>
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
      <h3 class="section-subtitle">\u521B\u4F5C\u4F60\u7684\u76AE\u80A4</h3>
      <form id="skinForm" class="skin-form">
        <div class="form-row">
          <label>\u76AE\u80A4\u540D\u79F0</label>
          <input name="name" placeholder="\u4F8B\uFF1A\u51B0\u7EA2\u8336\u6218\u795E\xB7\u7A76\u6781\u4F53" maxlength="30" required />
        </div>
        <div class="form-row">
          <label>\u7ED1\u5B9A\u89D2\u8272</label>
          <select name="characterId">
            <option value="">\u901A\u7528\u76AE\u80A4</option>
            ${charOptions.map((c) => `<option value="${c.id}">${c.emoji} ${esc(c.name)}</option>`).join("")}
          </select>
        </div>
        <div class="form-row">
          <label>\u76AE\u80A4\u63CF\u8FF0</label>
          <textarea name="desc" placeholder="\u63CF\u8FF0\u4F60\u7684\u62BD\u8C61\u521B\u610F\u2026\u2026" maxlength="200" rows="3"></textarea>
        </div>
        <div class="form-row">
          <label>\u8868\u60C5/\u56FE\u6807</label>
          <input name="emoji" placeholder="\u{1F3A8}" maxlength="4" value="\u{1F3A8}" />
        </div>
        <button type="submit" class="btn btn-primary">\u4E0A\u4F20\u76AE\u80A4</button>
      </form>
    </section>

    <section class="section">
      <h3 class="section-subtitle">\u76AE\u80A4\u5E7F\u573A</h3>
      <div class="skin-grid" id="skinGrid">
        ${skins.length ? skins.map(renderSkinCard).join("") : '<p class="empty">\u8FD8\u6CA1\u6709\u76AE\u80A4\uFF0C\u6765\u505A\u7B2C\u4E00\u4E2A\u9020\u6897\u738B</p>'}
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
        emoji: fd.get("emoji") || "\u{1F3A8}"
      });
      if (result.ok) {
        showToast("\u76AE\u80A4\u4E0A\u4F20\u6210\u529F\uFF01\u7B49\u5F85\u51A5\u754C\u5BA1\u6838", "success");
        renderSkins();
      } else {
        showToast(result.reason || "\u4E0A\u4F20\u5931\u8D25", "error");
      }
    });
    bindSkinLikeEvents();
  }
  function renderSkinCard(s) {
    const char = CHARACTERS.find((c) => c.id === s.characterId);
    return `
    <div class="skin-card" data-skin="${s.id}">
      <div class="skin-emoji">${s.emoji || "\u{1F3A8}"}</div>
      <h4>${esc(s.name)}</h4>
      <p>${esc(s.desc || "")}</p>
      <div class="skin-meta">
        <span>${s.official ? "\u5B98\u65B9" : esc(s.author || "\u533F\u540D")}</span>
        ${char ? `<span>${char.emoji} ${esc(char.name)}</span>` : ""}
      </div>
      <button class="btn-like" data-like="${s.id}" ${s.official ? "disabled" : ""}>
        \u2764\uFE0F ${Number(s.likes) || 0}
      </button>
    </div>
  `;
  }
  function bindSkinLikeEvents() {
    app.querySelectorAll("[data-like]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const result = like(btn.dataset.like);
        if (result.ok) {
          btn.textContent = `\u2764\uFE0F ${result.likes}`;
          if (result.likes >= 100) showToast("\u{1F389} \u606D\u559C\u83B7\u5F97\u300C\u53F2\u8BD7\u7EA7\u9020\u6897\u738B\u300D\u79F0\u53F7\uFF01", "success");
        }
      });
    });
  }
  function renderProfile() {
    const profile = getProfile();
    const titles = getTitles();
    const titleList = titles.map((id) => OFFICIAL_TITLES[id]).filter(Boolean);
    const allTitles = Object.values(OFFICIAL_TITLES);
    app.innerHTML = `
    <section class="page-header">
      <h2>\u{1F464} \u51A5\u754C\u6863\u6848</h2>
      <p>\u4F60\u7684\u79F0\u53F7\u4E0E\u53C2\u4E0E\u8BB0\u5F55</p>
    </section>

    <section class="profile-card">
      <div class="profile-avatar">${profile.avatar || "\u{1F47B}"}</div>
      <div class="profile-info">
        <input class="profile-name-input" id="nicknameInput" value="${esc(profile.nickname)}" maxlength="20" />
        <small>\u52A0\u5165\u51A5\u754C\uFF1A${new Date(profile.joinedAt).toLocaleDateString("zh-CN")}</small>
      </div>
      <button class="btn-sm" id="saveNickname">\u4FDD\u5B58</button>
    </section>

    <section class="section">
      <h3 class="section-subtitle">\u5DF2\u83B7\u79F0\u53F7 (${titleList.length})</h3>
      <div class="title-grid">
        ${titleList.length ? titleList.map((t) => `
          <div class="title-badge rarity-${t.rarity}">
            <span class="title-icon">${{ common: "\u{1FA99}", rare: "\u{1F48E}", epic: "\u{1F525}", legendary: "\u{1F451}" }[t.rarity] || "\u{1F3C5}"}</span>
            <strong>${esc(t.name)}</strong>
            <p>${esc(t.desc)}</p>
          </div>
        `).join("") : '<p class="empty">\u8FD8\u6CA1\u6709\u79F0\u53F7\uFF0C\u5FEB\u53BB\u6295\u7968\u3001\u804A\u5929\u3001\u9020\u6897\u5427</p>'}
      </div>
    </section>

    <section class="section">
      <h3 class="section-subtitle">\u5168\u90E8\u79F0\u53F7\u4E00\u89C8</h3>
      <div class="title-grid locked">
        ${allTitles.map((t) => {
      const earned = titles.includes(t.id);
      return `
            <div class="title-badge rarity-${t.rarity} ${earned ? "" : "locked-badge"}">
              <span class="title-icon">${earned ? "\u2705" : "\u{1F512}"}</span>
              <strong>${esc(t.name)}</strong>
              <p>${esc(t.desc)}</p>
            </div>
          `;
    }).join("")}
      </div>
    </section>

    <section class="section stats">
      <div class="stat-item"><span>${getChatCount()}</span><label>\u5BF9\u8BDD\u6B21\u6570</label></div>
      <div class="stat-item"><span>${getAllSkins().filter((s) => !s.official).length}</span><label>\u4E0A\u4F20\u76AE\u80A4</label></div>
      <div class="stat-item"><span>${titles.length}</span><label>\u83B7\u5F97\u79F0\u53F7</label></div>
    </section>
  `;
    $("#saveNickname")?.addEventListener("click", () => {
      const name = $("#nicknameInput")?.value?.trim();
      if (name) {
        saveProfile({ nickname: name });
        showToast("\u6635\u79F0\u5DF2\u4FDD\u5B58", "success");
      }
    });
  }
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
      el.textContent = cd.ended ? currentView === "vote" ? "\u6295\u7968\u5DF2\u622A\u6B62" : "\u5DF2\u622A\u6B62" : currentView === "vote" ? `\u5269\u4F59 ${formatCountdown(cd)}` : formatCountdown(cd);
      if (cd.ended) clearInterval(countdownTimer);
    }, 1e3);
  }
  function init() {
    initStorage(CHARACTERS);
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => navigate(btn.dataset.view));
    });
    document.querySelector(".logo")?.addEventListener("click", () => navigate("home"));
    navigate("home");
  }
  init();
  window.__cyberTomb = { navigate, getLeaderboard, CHARACTERS };
})();
