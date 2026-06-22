import { CharacterPortrait } from "~/components/CharacterPortrait";
import type { PublicHero } from "~/server/db/types";

interface TombstoneCardProps {
  char: PublicHero & { voteCount?: number; pct?: number };
  extra?: React.ReactNode;
}

export function TombstoneCard({ char, extra }: TombstoneCardProps) {
  const recordId = char.id.slice(0, 8).toUpperCase();
  const statusLabel = char.status === "resurrected" ? "RESURRECTED" : "CANDIDATE";

  return (
    <div
      className="tombstone"
      style={{ "--accent": char.color || "#00ffcc" } as React.CSSProperties}
      data-id={char.id}
    >
      <div className="tombstone-rankline">
        <span className="tombstone-sigil">{statusLabel}</span>
        <span className="tombstone-id">ID:{recordId}</span>
      </div>
      <div className="tombstone-top">
        <CharacterPortrait characterId={char.id} characterName={char.name} size="lg" showLabel showDots />
        <div className="tombstone-info">
          <h3 className="tombstone-name">{char.name}</h3>
          <p className="tombstone-real">{char.realName}</p>
          <p className="tombstone-tag">{char.tagline || ""}</p>
        </div>
      </div>
      <p className="tombstone-epitaph">&ldquo;{char.epitaph || ""}&rdquo;</p>
      {extra}
    </div>
  );
}
