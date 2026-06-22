import type { StaticImageData } from "next/image";
import type { CharacterId } from "~/data/characters";
import { getSkins } from "~/lib/storage";
import type { CharacterSkinEntry, PortraitImage } from "./types";

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

export type { CharacterSkinEntry, PortraitImage } from "./types";

function toPortraitImage(image: StaticImageData): PortraitImage {
  return {
    src: image.src,
    width: image.width,
    height: image.height,
  };
}

function staticSkin(
  id: string,
  label: string,
  image: StaticImageData,
  classic?: boolean,
): CharacterSkinEntry {
  return { id, label, image: toPortraitImage(image), classic };
}

/** 暂无专属皮肤的角色统一占位 */
export const PLACEHOLDER_SKIN: CharacterSkinEntry = staticSkin("classic", "经典", laodaClassic, true);

const LAODA_SKINS: CharacterSkinEntry[] = [
  staticSkin("classic", "经典", laodaClassic, true),
  staticSkin("baoan", "保安", laodaBaoan),
  staticSkin("waimai", "外卖", laodaWaimai),
  staticSkin("kuaidi", "快递", laodaKuaidi),
  staticSkin("meituan", "美团", laodaMeituan),
  staticSkin("jingcha", "警察", laodaJingcha),
  staticSkin("hushi", "护士", laodaHushi),
  staticSkin("mixue", "蜜雪冰城", laodaMixue),
  staticSkin("daxuesheng", "大学生", laodaDaxuesheng),
  staticSkin("fuwuyuan", "服务员", laodaFuwyuan),
  staticSkin("gongren", "工人", laodaGongren),
  staticSkin("tumu", "土木", laodaTumu),
];

const CHARACTER_SKIN_MAP: Partial<Record<CharacterId, CharacterSkinEntry[]>> = {
  laoda: LAODA_SKINS,
};

function getApprovedUserSkins(characterId: string): CharacterSkinEntry[] {
  if (typeof window === "undefined") return [];
  return getSkins()
    .filter(
      (skin) =>
        skin.reviewStatus === "approved" &&
        skin.characterId === characterId &&
        Boolean(skin.imageUrl),
    )
    .map((skin) => ({
      id: skin.id,
      label: skin.name,
      image: {
        src: skin.imageUrl!,
        width: skin.imageWidth,
        height: skin.imageHeight,
      },
    }));
}

export function getCharacterSkins(characterId: string): CharacterSkinEntry[] {
  const base = CHARACTER_SKIN_MAP[characterId] ?? [PLACEHOLDER_SKIN];
  const userSkins = getApprovedUserSkins(characterId);
  return userSkins.length ? [...base, ...userSkins] : base;
}

export function getClassicSkinIndex(skins: CharacterSkinEntry[]): number {
  const idx = skins.findIndex((s) => s.classic);
  return idx >= 0 ? idx : 0;
}
