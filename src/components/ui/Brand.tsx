// Brand marks: the maple leaf (also the "1" of the dice) and the "piasse"
// coin (an 11-sided gold loonie with a red maple leaf).

// Maple leaf outline in a 100×100 box. Shared with the 3D dice textures.
export const MAPLE_LEAF_POINTS: [number, number][] = [
  [50, 2], [57, 15], [66, 10], [63, 32], [77, 18], [80, 26], [94, 23], [89, 39],
  [97, 43], [73, 61], [77, 70], [53, 67], [53, 95], [47, 95], [47, 67], [23, 70],
  [27, 61], [3, 43], [11, 39], [6, 23], [20, 26], [23, 18], [37, 32], [34, 10], [43, 15],
];

const LEAF_PATH = `M${MAPLE_LEAF_POINTS.map(([x, y]) => `${x} ${y}`).join(' L')} Z`;

// 11-gon (the loonie's shape) inscribed in a 100×100 box.
const COIN_POINTS = '50,4 75,11 92,31 95,57 82,80 59,95 41,95 18,80 5,57 8,31 25,11';

interface MarkProps {
  size?: number;
  className?: string;
}

export const MapleLeaf = ({ size = 20, className }: MarkProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
    <path d={LEAF_PATH} fill="#ff4757" stroke="#111e2e" strokeWidth={6} strokeLinejoin="round" />
  </svg>
);

export const Coin = ({ size = 40, className }: MarkProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
    <polygon points={COIN_POINTS} fill="#ffd32a" stroke="#111e2e" strokeWidth={6} strokeLinejoin="round" />
    <polygon
      points={COIN_POINTS}
      fill="none"
      stroke="#c99a00"
      strokeWidth={3}
      transform="translate(14 14) scale(0.72)"
      strokeLinejoin="round"
    />
    <path
      d={LEAF_PATH}
      transform="translate(25 22) scale(0.5)"
      fill="#ff4757"
      stroke="#111e2e"
      strokeWidth={7}
      strokeLinejoin="round"
    />
  </svg>
);
