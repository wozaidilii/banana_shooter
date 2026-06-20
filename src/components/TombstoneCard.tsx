import type { Character } from "~/data/characters";

interface TombstoneCardProps {
  char: Character & { voteCount?: number; pct?: number };
  extra?: React.ReactNode;
}

export function TombstoneCard({ char, extra }: TombstoneCardProps) {
  return (
    <div
      className="tombstone"
      style={{ "--accent": char.color || "#00ffcc" } as React.CSSProperties}
      data-id={char.id}
    >
      <div className="tombstone-top">
        <span className="tombstone-emoji">{char.emoji || "💀"}</span>
        <div className="tombstone-info">
          <h3 className="tombstone-name">{char.name}</h3>
          <p className="tombstone-tag">{char.tagline || ""}</p>
        </div>
      </div>
      <p className="tombstone-epitaph">&ldquo;{char.epitaph || ""}&rdquo;</p>
      {extra}
    </div>
  );
}
