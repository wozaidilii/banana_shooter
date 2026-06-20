export type TitleRarity = "common" | "rare" | "epic" | "legendary";

export interface OfficialTitle {
  id: string;
  name: string;
  desc: string;
  rarity: TitleRarity;
}

export const OFFICIAL_TITLES: Record<string, OfficialTitle> = {
  first_vote: { id: "first_vote", name: "冥界选民", desc: "投出第一票", rarity: "common" },
  chat_10: { id: "chat_10", name: "阴阳师", desc: "与赛博亡灵对话10次", rarity: "common" },
  skin_creator: { id: "skin_creator", name: "梗图炼金术士", desc: "上传第一个皮肤", rarity: "rare" },
  skin_viral: { id: "skin_viral", name: "史诗级造梗王", desc: "皮肤获100+点赞", rarity: "epic" },
  skin_adopted: { id: "skin_adopted", name: "官方认证抽象大师", desc: "皮肤被官方收录", rarity: "legendary" },
  vote_all: { id: "vote_all", name: "全票打call人", desc: "为所有候选人投票", rarity: "rare" },
  early_bird: { id: "early_bird", name: "冥界早鸟", desc: "复活赛期间参与", rarity: "common" },
};
