import { scoreBand } from "@/lib/format";

// The score 300–1000 as a ring, with the band label always written next to
// it: the colour alone never carries the meaning.

const tones = {
  coral: "stroke-coral text-coral",
  ambar: "stroke-ambar text-ambar",
  senal: "stroke-senal text-senal",
  lavanda: "stroke-lavanda text-lavanda",
} as const;

export function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const band = scoreBand(score);
  const ratio = Math.min(1, Math.max(0, (score - 300) / 700));
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <figure className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="6" className="stroke-linea" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${c * ratio} ${c}`}
            transform="rotate(-90 50 50)"
            className={tones[band.tone]}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num font-display text-4xl font-bold leading-none">{score}</span>
          <span className="label mt-1 text-niebla">de 1000</span>
        </div>
      </div>
      <figcaption className={`label ${tones[band.tone].split(" ")[1]}`}>
        {score} · {band.label}
      </figcaption>
    </figure>
  );
}
