import { MAPLE_LEAF_POINTS } from './Brand';

// Pip positions on a face, as fractions of its size (same as the 3D textures).
export const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  3: [
    [0.28, 0.28],
    [0.5, 0.5],
    [0.72, 0.72],
  ],
  4: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  5: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.5, 0.5],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  6: [
    [0.28, 0.26],
    [0.28, 0.5],
    [0.28, 0.74],
    [0.72, 0.26],
    [0.72, 0.5],
    [0.72, 0.74],
  ],
};

const LEAF = `M${MAPLE_LEAF_POINTS.map(([x, y]) => `${x} ${y}`).join(' L')} Z`;

interface DieFaceProps {
  // null: an empty slot (dashed outline).
  value: number | null;
  size?: number;
  className?: string;
  // Read as "Dé : 4" when given; decorative otherwise.
  label?: string;
}

// Flat die of the reference: white, ink outline, navy pips, and a red maple
// leaf for the 1. Used in the locked tray, the score reveal, the rules and
// as the no-WebGL fallback.
const DieFace = ({ value, size = 40, className, label }: DieFaceProps) => {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  if (value === null) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={className} focusable="false" {...a11y}>
        <rect x="6" y="6" width="88" height="88" rx="20" fill="none" stroke="#c99a00" strokeWidth="5" strokeDasharray="12 10" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} focusable="false" {...a11y}>
      <rect x="5" y="9" width="90" height="88" rx="20" fill="#111e2e" />
      <rect x="5" y="4" width="90" height="88" rx="20" fill="#ffffff" stroke="#111e2e" strokeWidth="6" />
      {value === 1 ? (
        <path d={LEAF} transform="translate(27 23) scale(0.46)" fill="#ff4757" stroke="#111e2e" strokeWidth="9" strokeLinejoin="round" />
      ) : (
        (PIPS[value] ?? []).map(([x, y], index) => (
          <circle key={index} cx={8 + x * 84} cy={4 + y * 86} r="9" fill="#1e293b" />
        ))
      )}
    </svg>
  );
};

export default DieFace;
