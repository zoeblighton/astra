/** 254 → "4:14" */
export function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

/** 412000 → "412K", 1250000 → "1.3M" */
export function formatCount(n) {
  return new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
