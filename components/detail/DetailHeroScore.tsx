import type { ReactElement } from "react";

function scoreClass(score: number): string {
  if (score >= 75) return "high";
  if (score >= 60) return "mid";
  return "low";
}

interface DetailHeroScoreProps {
  score: number;
  size?: "sm" | "md";
}

export function DetailHeroScore({ score, size = "md" }: DetailHeroScoreProps): ReactElement {
  const fontSize = size === "sm" ? "0.8125rem" : "0.875rem";
  const score10 = (score / 10).toFixed(1);

  return (
    <span
      className={`score-badge ${scoreClass(score)} inline-flex items-center gap-1 shrink-0`}
      style={{ fontSize, padding: "3px 8px" }}
    >
      {score10}
    </span>
  );
}
