export interface SkinTemplate {
  id: string;
  name: string;
  emoji: string;
  desc: string;
}

export const SKIN_TEMPLATES: SkinTemplate[] = [
  { id: "ice_tea", name: "冰红茶战神", emoji: "🧃", desc: "牢大经典皮肤，喝一口就起飞" },
  { id: "gaokao", name: "考研圣体", emoji: "📚", desc: "张雪峰附体，北方水土不服也得上岸" },
  { id: "chicken", name: "鸡你太美", emoji: "🐔", desc: "练习时长两年半的史诗皮肤" },
  { id: "horse", name: "耗子尾汁", emoji: "🥋", desc: "年轻人不讲武德限定款" },
  { id: "pure", name: "纯真电子烟", emoji: "🌿", desc: "理塘高原限定，一眼丁真" },
  { id: "cyber", name: "赛博骨灰盒", emoji: "💀", desc: "官方抽象皮肤，自带冥界光环" },
];
