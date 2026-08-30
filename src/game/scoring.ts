export function calculateOrderScore(itemCount: number, remainingRatio: number, combo: number, rush: boolean) {
  const base = itemCount * 200;
  const speed = Math.round(Math.max(0, Math.min(1, remainingRatio)) * 500);
  const comboMultiplier = Math.min(5, 1 + Math.floor(combo / 5) * 0.5);
  return Math.round((base + speed) * comboMultiplier * (rush ? 1.5 : 1));
}
