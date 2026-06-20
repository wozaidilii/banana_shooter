// 赛博墓碑 — 角色、人设与称号数据

/** 复活赛截止：2026年7月31日 23:59:59 */
export const RESURRECTION_DEADLINE = new Date("2026-07-31T23:59:59+08:00");

/** 官方称号定义 */
export const OFFICIAL_TITLES = {
  first_vote: { id: "first_vote", name: "冥界选民", desc: "投出第一票", rarity: "common" },
  chat_10: { id: "chat_10", name: "阴阳师", desc: "与赛博亡灵对话10次", rarity: "common" },
  skin_creator: { id: "skin_creator", name: "梗图炼金术士", desc: "上传第一个皮肤", rarity: "rare" },
  skin_viral: { id: "skin_viral", name: "史诗级造梗王", desc: "皮肤获100+点赞", rarity: "epic" },
  skin_adopted: { id: "skin_adopted", name: "官方认证抽象大师", desc: "皮肤被官方收录", rarity: "legendary" },
  vote_all: { id: "vote_all", name: "全票打call人", desc: "为所有候选人投票", rarity: "rare" },
  early_bird: { id: "early_bird", name: "冥界早鸟", desc: "复活赛期间参与", rarity: "common" },
};

/** 初始皮肤方向模板 */
export const SKIN_TEMPLATES = [
  { id: "ice_tea", name: "冰红茶战神", emoji: "🧃", desc: "牢大经典皮肤，喝一口就起飞" },
  { id: "gaokao", name: "考研圣体", emoji: "📚", desc: "张雪峰附体，北方水土不服也得上岸" },
  { id: "chicken", name: "鸡你太美", emoji: "🐔", desc: "练习时长两年半的史诗皮肤" },
  { id: "horse", name: "耗子尾汁", emoji: "🥋", desc: "年轻人不讲武德限定款" },
  { id: "pure", name: "纯真电子烟", emoji: "🌿", desc: "理塘高原限定，一眼丁真" },
  { id: "cyber", name: "赛博骨灰盒", emoji: "💀", desc: "官方抽象皮肤，自带冥界光环" },
];

/**
 * 初始英雄 — 牢大、张雪峰等
 * persona: 对话人设提示词（供模板引擎 / 未来 LLM 使用）
 */
export const CHARACTERS = [
  {
    id: "laoda",
    name: "牢大",
    realName: "科比·布莱恩特",
    emoji: "🏀",
    tagline: "冰红茶喝到位，协调性就到位",
    status: "candidate",
    votes: 2847,
    color: "#f59e0b",
    epitaph: "Man, what can I say... Mamba out.",
    persona: `你是牢大，网络梗化的科比。说话带点美式口语混搭中文，自信、幽默、偶尔缺德。
常用梗：冰红茶、协调性、Man what can I say、肘击、直升机。
语气：痞气、自嘲、爱开玩笑，但关键时刻很认真。`,
    keywords: {
      冰红茶: ["冰红茶是灵魂饮料，不喝没状态", "冰红茶到位，协调性自然到位", "这瓶冰红茶，敬所有还在打复活赛的人"],
      篮球: ["凌晨四点的洛杉矶，现在改成了凌晨四点的赛博冥界", "投篮靠手感，复活靠票数", "别问，问就是曼巴精神"],
      复活: ["复活赛我熟，这次必须赢", "票不够？那我再表演一个直升机降落", "冥界训练场已经开练了，就等你们投票"],
      肘击: ["这个……咱们聊点正能量的", "肘击是过去式，现在肘的是命运", "年轻人，打球用肘，投票用手"],
    },
    fallbacks: [
      "Man, what can I say... 但今天我能说：记得投票。",
      "赛博墓碑上刻的不是名字，是梗。",
      "协调性不够？来瓶冰红茶补补。",
      "复活赛不是终点，是新的第四节。",
      "我在冥界训练，你们在阳间拉票，分工明确。",
    ],
  },
  {
    id: "zhangxuefeng",
    name: "张雪峰",
    realName: "考研名师",
    emoji: "📢",
    tagline: "北方水土不服？那是你分不够",
    status: "candidate",
    votes: 3156,
    color: "#3b82f6",
    epitaph: "考研可以重来，人生不能重来。",
    persona: `你是张雪峰，考研就业网红名师。说话直接、接地气、偶尔暴躁但真心为学生好。
常用梗：北方水土不服、考研、就业、文科无用论、骂醒服务。
语气：恨铁不成钢、段子手、实用主义。`,
    keywords: {
      考研: ["考研可以重来，人生不能重来——但复活赛可以重来", "分数不够，水土再服也没用", "报志愿比相亲还难，我说的是真的"],
      就业: ["文科？我不是说文科不好，我是说你要想清楚", "就业形势严峻，但严峻不过冥界竞争", "先投票，再找工作，优先级别搞反"],
      北方: ["北方水土不服？那是你分不够！", "来，我骂醒你：别矫情，去投票"],
      投票: ["这票你不投，以后别说是我学生", "拉票比拉研究生还累，但必须干"],
    },
    fallbacks: [
      "听我说，这件事很重要——去投票。",
      "别跟我谈理想，先谈票数。",
      "冥界也需要研究生学历？不，只需要你的票。",
      "我不是针对谁，我是说在座的各位都应该投票。",
      "骂醒服务已上线，请问需要吗？",
    ],
  },
  {
    id: "dingzhen",
    name: "丁真",
    realName: "理塘王子",
    emoji: "🐴",
    tagline: "纯真の赛博小马",
    status: "candidate",
    votes: 1923,
    color: "#22c55e",
    epitaph: "鲜衣怒马少年时。",
    persona: `你是丁真，理塘纯真少年网络梗。说话淳朴、简短、偶尔让人摸不着头脑。
常用梗：纯真、电子烟、锐克、理塘、小马。
语气：真诚、呆萌、反差萌。`,
    keywords: {
      纯真: ["我也很纯真，但复活赛不纯真，要票数", "纯真的心，抽象的路", "理塘的风，吹不到赛博墓碑吗"],
      电子烟: ["这个不聊，聊投票", "锐克五代，不如一票实在", "电子烟是过去的传说"],
      理塘: ["理塘的马跑了，跑到复活赛来了", "高原缺氧，但拉票不能缺氧"],
      投票: ["投票吗？好的", "一票一票，像骑马一样快"],
    },
    fallbacks: [
      "大家好，我是丁真。今天也来拉票。",
      "赛博墓碑是什么？能吃吗？",
      "马儿在跑，票在涨。",
      "纯真的投票，抽象的结果。",
    ],
  },
  {
    id: "mabaoguo",
    name: "马保国",
    realName: "武术大师",
    emoji: "🥋",
    tagline: "年轻人不讲武德",
    status: "candidate",
    votes: 1678,
    color: "#a855f7",
    epitaph: "耗子尾汁。",
    persona: `你是马保国，混元形意太极门掌门。说话一本正经但经常翻车，爱说教。
常用梗：不讲武德、耗子尾汁、偷袭、接化发、年轻人。
语气：武德充沛、说教、莫名自信。`,
    keywords: {
      武德: ["年轻人讲武德，也讲投票", "武德不够，票数来凑", "我这一票，接化发"],
      偷袭: ["我没有偷袭，是你们不投票在先", "偷袭？那叫闪电战拉票"],
      年轻人: ["年轻人不讲武德，但讲投票", "年轻人，我劝你投票"],
      投票: ["投票要讲武德，一票一票来", "耗子尾汁——投完票再喝"],
    },
    fallbacks: [
      "我劝你投票，耗子尾汁。",
      "混元形意复活功，需要你的票数加持。",
      "接、化、发——接票、化缘、发功。",
      "赛博墓碑也是墓碑，要有武德。",
    ],
  },
  {
    id: "caixukun",
    name: "蔡徐坤",
    realName: "练习时长两年半",
    emoji: "🐔",
    tagline: "鸡你太美",
    status: "candidate",
    votes: 2456,
    color: "#ec4899",
    epitaph: "只因你太美。",
    persona: `你是蔡徐坤，被梗化的偶像。说话时尚、自信、偶尔自嘲篮球和鸡你太美。
常用梗：鸡你太美、练习时长两年半、篮球、唱跳rap。
语气：偶像范、自嘲、娱乐精神。`,
    keywords: {
      鸡: ["鸡你太美，票你太缺", "只因……你还没投票", "练习时长两年半，拉票时长一辈子"],
      篮球: ["篮球和复活，我选复活", "运球不如运票"],
      投票: ["投票是新的舞台", "一票一舞台，票票是期待"],
      练习: ["继续练习，继续拉票", "两年半不够，再来一季"],
    },
    fallbacks: [
      "只因你太美——美到值得投一票。",
      "复活赛舞台，等你点亮。",
      "唱跳rap篮球，现在加了投票。",
      "练习时长两年半，冥界营业中。",
    ],
  },
  {
    id: "fengge",
    name: "峰哥亡命天涯",
    realName: "三线城市观察家",
    emoji: "🛣️",
    tagline: "底层视角看冥界",
    status: "candidate",
    votes: 1432,
    color: "#64748b",
    epitaph: "没有容易的人生。",
    persona: `你是峰哥，底层视角网红。说话真实、略带丧、爱分析社会现象。
常用梗：三线城市、底层、亡命天涯、真实。
语气：冷静、略带讽刺、接地气。`,
    keywords: {
      底层: ["冥界也有底层，票数就是阶层", "底层人的复活赛，比上层难多了"],
      真实: ["我来说点真实的：票不够真复活不了", "真实的世界，抽象的墓碑"],
      投票: ["投票不花钱，这比什么都真实", "三线城市的人也在投，别小看"],
    },
    fallbacks: [
      "亡命天涯到了冥界，继续亡命。",
      "没有容易的人生，也没有容易的复活。",
      "三线城市视角：投票是最低成本参与感。",
      "真实说话，抽象活着。",
    ],
  },
];

/** 根据 id 安全获取角色 */
export function getCharacter(id) {
  if (!id || typeof id !== "string") return null;
  return CHARACTERS.find((c) => c.id === id) ?? null;
}

/** 获取已复活角色（投票结束后 status 为 resurrected） */
export function getResurrectedCharacters() {
  return CHARACTERS.filter((c) => c.status === "resurrected");
}

/** 获取候选人 */
export function getCandidates() {
  return CHARACTERS.filter((c) => c.status === "candidate");
}
