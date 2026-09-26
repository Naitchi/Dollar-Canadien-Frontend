import { RefObject, useEffect, useRef, useState } from 'react';

// Components
import DiceLockAnimation from '../DiceLockAnimation/DiceLockAnimation';

// Functions
import { diePxFor, slotsFor } from './diceMath';
import {
  Row,
  Stage,
  createStage,
  disposeStage,
  layoutStage,
  throwDice,
  updateStage,
} from './stage';

// Styles
import styles from './Dices3D.module.css';

const NO_HITS: number[] = [];

interface Dices3DProps {
  // The dice to show, or null for none (e.g. between two rolls). A new array
  // of values after null throws the dice again.
  dices: number[] | null;
  // Indexes of the selected dice.
  selected: number[];
  // Whether the selected dice are being locked (shows the lock animation).
  locking: boolean;
  // Whether the dice can be clicked (it's our turn).
  interactive: boolean;
  onToggle?: (index: number) => void;
  // False to show the dice already landed, without throwing them.
  animated?: boolean;
  // Indexes of the dice to highlight once landed (attack number hits).
  hits?: number[];
  // Changing it throws the dice again, even with the same values (attack rerolls).
  throwKey?: number | string;
  // The row where the dice must land (the old flat dice row), inside the
  // positioned element this component covers.
  rowRef: RefObject<HTMLDivElement>;
}

// Dice thrown from the far end of the box, tumbling and bouncing towards the
// camera, then landing in a row exactly where the old flat dice were. Clicks
// go to invisible buttons laid over the landed dice. Falls back to flat dice
// when WebGL isn't available.
const Dices3D: React.FC<Dices3DProps> = ({
  dices,
  selected,
  locking,
  interactive,
  onToggle,
  animated = true,
  hits = NO_HITS,
  throwKey,
  rowRef,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const selectedRef = useRef(selected);
  const hitsRef = useRef(hits);
  const layoutRef = useRef<() => void>(() => {});
  const [row, setRow] = useState<Row | null>(null);
  const [settled, setSettled] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  // The dice can't be placed on the row (row outside of the camera view).
  const [layoutFailed, setLayoutFailed] = useState(false);
  const flat = webglFailed || layoutFailed;

  // Changes only when the values change, not on every Pusher update.
  const dicesKey = dices ? dices.join(',') : '';

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    hitsRef.current = hits;
  }, [hits]);

  // Creates the three.js scene once, keeps it sized, animates it, and cleans
  // it up on unmount.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let stage: Stage | null = null;
    try {
      stage = createStage(root, styles.canvas);
    } catch (error) {
      console.error('WebGL indisponible, affichage des dés en 2D :', error);
      setWebglFailed(true);
    }
    stageRef.current = stage;

    // Where the row is, relative to this component (the flat fallback needs it too).
    const layout = () => {
      const rootRect = root.getBoundingClientRect();
      const rowRect = rowRef.current?.getBoundingClientRect() ?? rootRect;
      const newRow = {
        left: rowRect.left - rootRect.left,
        centerY: rowRect.top - rootRect.top + rowRect.height / 2,
        diePx: diePxFor(rowRect.width),
      };
      setRow((current) =>
        current?.left === newRow.left &&
        current.centerY === newRow.centerY &&
        current.diePx === newRow.diePx
          ? current
          : newRow,
      );
      if (stage && root.clientWidth && root.clientHeight) {
        layoutStage(stage, root.clientWidth, root.clientHeight, newRow);
        setLayoutFailed(!stage.layout);
      }
    };
    layoutRef.current = layout;

    const observer = new ResizeObserver(layout);
    observer.observe(root);
    if (rowRef.current) observer.observe(rowRef.current);
    layout();

    let frame = 0;
    if (stage) {
      const live = stage;
      frame = requestAnimationFrame(function tick(now: number) {
        frame = requestAnimationFrame(tick);
        const moving = updateStage(live, now, selectedRef.current, hitsRef.current);
        if (!moving && !live.settled) {
          live.settled = true;
          setSettled(true);
        }
      });
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      stageRef.current = null;
      if (stage) disposeStage(stage);
    };
  }, [rowRef]);

  // Throws the dice every time new values come in.
  useEffect(() => {
    const stage = stageRef.current;
    const values = dicesKey ? dicesKey.split(',').map(Number) : [];
    if (!stage) {
      // No WebGL: the flat dice are usable right away.
      setSettled(true);
      return;
    }

    throwDice(stage, values, animated);
    setSettled(values.length === 0);
    // The number of dice changed: recompute where they land.
    layoutRef.current();
  }, [dicesKey, animated, throwKey]);

  return (
    <div ref={rootRef} className={styles.stage}>
      {/* The buttons (and their selection marker) only appear once the dice have landed. */}
      {row &&
        (settled || flat) &&
        dices?.map((value, index) => {
          const isSelected = selected.includes(index);
          const isHit = hits.includes(index);
          const canClick = interactive && !!onToggle;
          const slot = slotsFor(dices.length, row.left, row.centerY, row.diePx)[index];
          return (
            <button
              key={index}
              className={`${styles.die} ${flat ? styles.flat : ''} ${
                isSelected ? styles.selected : ''
              } ${isHit ? styles.hit : ''}`}
              style={{
                left: slot.x - row.diePx / 2,
                top: slot.y - row.diePx / 2,
                width: row.diePx,
                height: row.diePx,
                fontSize: row.diePx * 0.75,
              }}
              onClick={canClick ? () => onToggle(index) : undefined}
              disabled={!canClick}
              aria-label={`Dé ${index + 1} : ${value}`}
              aria-pressed={interactive ? isSelected : undefined}
            >
              {flat && value}
              <DiceLockAnimation show={locking && isSelected} />
            </button>
          );
        })}
    </div>
  );
};

export default Dices3D;
