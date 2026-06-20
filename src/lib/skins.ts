import { CHARACTERS } from "~/data/characters";
import { SKIN_TEMPLATES } from "~/data/skin-templates";
import { addSkin, getSkins, getTitles, grantTitle, likeSkin } from "~/lib/storage";

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

export function getAllSkins(): DisplaySkin[] {
  const userSkins = getSkins();
  const official: DisplaySkin[] = SKIN_TEMPLATES.map((t) => ({
    ...t,
    id: `official_${t.id}`,
    official: true,
    author: "赛博墓碑官方",
    likes: Math.floor(Math.random() * 50) + 20,
    characterId: guessCharacterForTemplate(t.id),
  }));
  return [...userSkins, ...official];
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
