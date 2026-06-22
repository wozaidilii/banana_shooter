import { CHARACTERS } from "~/data/characters";
import { SKIN_TEMPLATES } from "~/data/skin-templates";
import {
  addSkin,
  getPendingSkins,
  getSkins,
  getTitles,
  grantTitle,
  likeSkin,
  reviewSkin as reviewSkinInStorage,
  type UserSkin,
} from "~/lib/storage";

export { SKIN_TEMPLATES };

export interface DisplaySkin {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  characterId: string;
  author: string;
  likes: number;
  official?: boolean;
  reviewStatus?: UserSkin["reviewStatus"];
}

function guessCharacterForTemplate(templateId: string): string {
  const map: Record<string, string> = {
    ice_tea: "laoda",
    gaokao: "zhangxuefeng",
    chicken: "caixukun",
    horse: "mabaoguo",
    pure: "dingzhen",
    cyber: "",
  };
  return map[templateId] ?? "";
}

function toDisplaySkin(skin: UserSkin): DisplaySkin {
  return {
    id: skin.id,
    name: skin.name,
    emoji: skin.emoji,
    desc: skin.desc,
    characterId: skin.characterId,
    author: skin.author,
    likes: skin.likes,
    reviewStatus: skin.reviewStatus,
  };
}

export function getAllSkins(): DisplaySkin[] {
  const userSkins = getSkins()
    .filter((s) => s.reviewStatus === "approved")
    .map(toDisplaySkin);
  const official: DisplaySkin[] = SKIN_TEMPLATES.map((t) => ({
    ...t,
    id: `official_${t.id}`,
    official: true,
    author: "赛博墓碑官方",
    likes: Math.floor(Math.random() * 50) + 20,
    characterId: guessCharacterForTemplate(t.id),
    reviewStatus: "approved" as const,
  }));
  return [...userSkins, ...official];
}

export function getPendingSkinSubmissions(): DisplaySkin[] {
  return getPendingSkins().map(toDisplaySkin);
}

export function createSkin(data: {
  name?: string;
  desc?: string;
  characterId?: string;
  emoji?: string;
}): { ok: boolean; reason?: string } {
  const result = addSkin(data);
  if (!result.ok) return result;

  const titles = getTitles();
  if (!titles.includes("skin_creator")) {
    grantTitle("skin_creator");
  }

  return result;
}

export function reviewSkin(
  skinId: string,
  decision: "approved" | "rejected",
  reviewNote?: string,
): { ok: boolean; reason?: string } {
  return reviewSkinInStorage(skinId, decision, reviewNote);
}

export function like(skinId: string): { ok: boolean; likes?: number } {
  const likes = likeSkin(skinId);
  if (!likes) return { ok: false };

  if (likes >= 100 && !getTitles().includes("skin_viral")) {
    grantTitle("skin_viral");
  }

  return { ok: true, likes };
}

export function getCharacterOptions() {
  return CHARACTERS.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }));
}
