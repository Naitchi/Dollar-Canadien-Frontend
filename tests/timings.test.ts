import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import {
  ATTACK_BADGE_MS,
  ATTACK_ROUND_MS,
  DAMAGE_ANIMATION_MS,
  DAMAGE_BADGE_DELAY_MS,
  LOCK_DELAY_MS,
  SCORE_ANIMATION_MS,
  SCORE_BEATS_MS,
} from '@/constants/timings';

// The backend computes turn deadlines from these durations: they must not
// change on the front alone.
describe('animation timings', () => {
  it('keeps the values the backend mirrors', () => {
    expect(SCORE_ANIMATION_MS).toBe(6000);
    expect(ATTACK_ROUND_MS).toBe(2800);
    expect(ATTACK_BADGE_MS).toBe(2000);
    expect(DAMAGE_ANIMATION_MS).toBe(2500);
    expect(DAMAGE_BADGE_DELAY_MS).toBe(900);
    expect(LOCK_DELAY_MS).toBe(1400);
  });

  it('keeps every score beat inside the score animation, in order', () => {
    const beats = Object.values(SCORE_BEATS_MS);
    expect([...beats].sort((a, b) => a - b)).toEqual(beats);
    expect(Math.max(...beats)).toBeLessThan(SCORE_ANIMATION_MS);
  });

  // When the backend sits next to the frontend (this repository), compare
  // with its source directly.
  const turnJs = path.resolve(__dirname, '../../backend/functions/turn.js');
  it.skipIf(!fs.existsSync(turnJs))('matches backend/functions/turn.js', () => {
    const source = fs.readFileSync(turnJs, 'utf8');
    const read = (name: string) => {
      const match = source.match(new RegExp(`${name}\\s*=\\s*([\\d_]+)`));
      return match ? Number(match[1].replace(/_/g, '')) : NaN;
    };
    expect(read('SCORE_ANIMATION_MS')).toBe(SCORE_ANIMATION_MS);
    expect(read('ATTACK_ROUND_MS')).toBe(ATTACK_ROUND_MS);
    expect(read('ATTACK_BADGE_MS')).toBe(ATTACK_BADGE_MS);
    expect(read('DAMAGE_ANIMATION_MS')).toBe(DAMAGE_ANIMATION_MS);
  });
});
