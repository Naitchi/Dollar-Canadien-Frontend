import { CSSProperties, useState } from 'react';

// Styles
import styles from './Confetti.module.css';

const COLORS = ['#f5c542', '#ff6b6b', '#6fdc8c', '#4dabf7', '#b197fc', '#ffffff'];
const PIECE_COUNT = 90;

interface Piece {
  left: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
  rotate: number;
  color: string;
}

const createPieces = (): Piece[] =>
  Array.from({ length: PIECE_COUNT }, (_, index) => ({
    left: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 3 + Math.random() * 3,
    size: 6 + Math.random() * 6,
    drift: (Math.random() - 0.5) * 160,
    rotate: Math.random() * 360,
    color: COLORS[index % COLORS.length],
  }));

// Confetti falling over the whole screen, twice, then gone.
const Confetti = () => {
  // Drawn once: re-renders must not move the pieces around.
  const [pieces] = useState(createPieces);

  return (
    <div className={styles.confetti} aria-hidden="true">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className={styles.piece}
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.size * 0.45,
              backgroundColor: piece.color,
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
