import type { StaticImageData } from "next/image";
import type { CharacterId } from "~/data/characters";

import laodaClassic from "./laoda/kobe_classic.png";
import laodaBaoan from "./laoda/kobe_保安.png";
import laodaWaimai from "./laoda/kobe_外卖.png";
import laodaKuaidi from "./laoda/kobe_快递.png";
import laodaMeituan from "./laoda/kobe_美团.png";
import laodaJingcha from "./laoda/kobe_警察.png";
import laodaHushi from "./laoda/kobe_护士.png";
import laodaMixue from "./laoda/kobe_蜜雪冰城.png";
import laodaDaxuesheng from "./laoda/kobe_大学生.png";
import laodaFuwyuan from "./laoda/kobe_服务员.png";
import laodaGongren from "./laoda/kobe_工人.png";
import laodaTumu from "./laoda/kobe_土木.png";

export interface CharacterSkinEntry {
  id: string;
  label: string;
  image: StaticImageData;
  classic?: boolean;
}

/** 暂无专属皮肤的角色统一占位 */
export const PLACEHOLDER_SKIN: CharacterSkinEntry = {
  id: "classic",
  label: "经典",
  image: laodaClassic,
  classic: true,
};

const LAODA_SKINS: CharacterSkinEntry[] = [
  { id: "classic", label: "经典", image: laodaClassic, classic: true },
  { id: "baoan", label: "保安", image: laodaBaoan },
  { id: "waimai", label: "外卖", image: laodaWaimai },
  { id: "kuaidi", label: "快递", image: laodaKuaidi },
  { id: "meituan", label: "美团", image: laodaMeituan },
  { id: "jingcha", label: "警察", image: laodaJingcha },
  { id: "hushi", label: "护士", image: laodaHushi },
  { id: "mixue", label: "蜜雪冰城", image: laodaMixue },
  { id: "daxuesheng", label: "大学生", image: laodaDaxuesheng },
  { id: "fuwuyuan", label: "服务员", image: laodaFuwyuan },
  { id: "gongren", label: "工人", image: laodaGongren },
  { id: "tumu", label: "土木", image: laodaTumu },
];

const CHARACTER_SKIN_MAP: Partial<Record<CharacterId, CharacterSkinEntry[]>> = {
  laoda: LAODA_SKINS,
};

export function getCharacterSkins(characterId: string): CharacterSkinEntry[] {
  return CHARACTER_SKIN_MAP[characterId] ?? [PLACEHOLDER_SKIN];
}

export function getClassicSkinIndex(skins: CharacterSkinEntry[]): number {
  const idx = skins.findIndex((s) => s.classic);
  return idx >= 0 ? idx : 0;
}
