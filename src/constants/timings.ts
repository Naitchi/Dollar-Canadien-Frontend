// Durations of the turn sequence. The backend mirrors them to compute the
// turn deadlines (backend/functions/turn.js: SCORE_ANIMATION_MS,
// ATTACK_ROUND_MS, ATTACK_BADGE_MS, DAMAGE_ANIMATION_MS): changing one here
// alone would let other players cut everyone's animation short, or leave the
// table waiting. tests/timings.test.ts fails if they drift apart.

// Between clicking "Garder" and sending the lock to the server (lock stamp).
export const LOCK_DELAY_MS = 1400;

// Score reveal (DicesResultsAnimation): its beats, then the end.
export const SCORE_BEATS_MS = {
  band: 500,
  dice: 2000,
  merge: 3000,
  total: 3700,
  verdict: 4000,
  out: 5000,
} as const;
export const SCORE_ANIMATION_MS = 6000;

// Attack (AttackAnimation): one 3D reroll per round, then the damage badge.
export const ATTACK_ROUND_MS = 2800;
export const ATTACK_BADGE_MS = 2000;

// Damage under 30 (DamageAnimation): the badge pops up, then the end.
export const DAMAGE_BADGE_DELAY_MS = 900;
export const DAMAGE_ANIMATION_MS = 2500;
