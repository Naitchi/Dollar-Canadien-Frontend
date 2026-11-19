import { CSSProperties, useState } from 'react';

// Styles
import styles from './Confetti.module.css';

// The reference's palette, plus maple leaves.
const COLORS = ['#ffd32a', '#ff7675', '#2ed573', '#54a0ff', '#ff9f43', '#ffffff'];
const PIECE_COUNT = 90;

interface Piece {
  left: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
  rotate: number;
  color: string;
  leaf: boolean;
}

const createPieces = (): Piece[] =>
  Array.from({ length: PIECE_COUNT }, (_, index) => ({
    left: Math.random() * 100,
    delay: Math.random() * 1,
    // Everything is gone within 5 s (no endless motion).
    duration: 2.6 + Math.random() * 1.4,
    size: 7 + Math.random() * 7,
    drift: (Math.random() - 0.5) * 160,
    rotate: Math.random() * 360,
    color: COLORS[index % COLORS.length],
    leaf: index % 5 === 0,
  }));

// Confetti (and a few maple leaves) falling once over the whole screen.
const Confetti = () => {
  // Drawn once: re-renders must not move the pieces around.
  const [pieces] = useState(createPieces);

  return (
    <div className={styles.confetti} aria-hidden="true">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className={`${styles.piece} ${piece.leaf ? styles.leaf : ''}`}
          style={
            {
              left: `${piece.left}%`,
              width: piece.leaf ? piece.size * 1.8 : piece.size,
              height: piece.leaf ? piece.size * 1.8 : piece.size * 0.45,
              backgroundColor: piece.leaf ? '#ff4757' : piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              '--drift': `${piece.drift}px`,
              '--rotate': `${piece.rotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
};

export default Confetti;
