import { RootState } from '@/store/store';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Service
import { changeGameStep, endTurn, lockDices } from '@/services/services';

// Styles
import styles from './Board.module.css';

// Types
import { Player, step } from '@/types/gameType';

// Functions
import { withDisplayedHp } from '@/functions/functions';

// Store
import { getClockOffset, getMe, getUser } from '@/store/slices/clientSlice';
import { selectActivePlayer } from '@/store/slices/gameSlice';

// Components
import AttackAnimation from '../AttackAnimation/AttackAnimation';
import DamageAnimation from '../DamageAnimation/DamageAnimation';
import DicesResultsAnimation from '../DicesResultsAnimation/DicesResultsAnimation';
import LowHealthVignette from '../LowHealthVignette/LowHealthVignette';
import PlayerComponent from '../Player/Player';
import TurnTimer from '../TurnTimer/TurnTimer';
import ActivePlayerBadge from './ActivePlayerBadge';
import LockButton from './LockButton';

// Hooks
import { useTurnTimeout } from './useTurnTimeout';

// three.js is heavy: only downloaded once the game starts (this board is
// mounted), which is well before the first throw, and never on the server.
const Dices3D = dynamic(() => import('../Dices3D/Dices3D'), { ssr: false });

// Where we are in the result sequence of the current turn, once the server
// has resolved it (step `scoreAdditionAnimation`): score sum animation, then
// the attack (above 30) or the damage taken (below 30), then nothing until
// the next turn.
type ResultPhase = 'score' | 'attack' | 'damage' | 'done';

// Locked dice can't be selected.
const NO_SELECTION: number[] = [];

// Steps during which the active player still has to act (roll or lock).
const PLAYING_STEPS: step[] = [step.none, step.dices, step.lockAnimation];

const Board = () => {
  const [selectedDices, setSelectedDices] = useState<number[]>([]);
  const [resultPhase, setResultPhase] = useState<ResultPhase>('score');
  // Whether the damage of the turn being animated has popped up yet (see displayed HP below).
  const [hpRevealed, setHpRevealed] = useState(false);
  // Everyone's HP before the current turn was resolved.
  const hpBeforeResolution = useRef<Record<string, number>>({});
  // Rows where the 3D dice land (thrown ones, and locked ones).
  const dicesRowRef = useRef<HTMLDivElement>(null);
  const lockedRowRef = useRef<HTMLDivElement>(null);

  const user = useSelector((state: RootState) => getUser(state));
  const me = useSelector((state: RootState) => getMe(state));
  const clockOffset = useSelector((state: RootState) => getClockOffset(state));
  const id = useSelector((state: RootState) => state.game.game?._id);
  const lobby = useSelector((state: RootState) => state.game.game);
  const activePlayer: Player | null = useSelector((state: RootState) =>
    selectActivePlayer(state.game),
  );

  const isMyTurn = !!me && me === activePlayer?._id;
  // The server applies the damage as soon as the turn is resolved: until the
  // damage pops up in the animation, keep showing the HP from before (in the
  // badges, the hearts, the skulls and the red screen edges).
  const hideNewHp = lobby?.step === step.scoreAdditionAnimation && !hpRevealed;
  const displayed = (player: Player): Player =>
    withDisplayedHp(player, hpBeforeResolution.current, hideNewHp);
  const shownActivePlayer = activePlayer && displayed(activePlayer);
  const myPlayer = lobby?.players.find((player) => player._id === me);
  const isPlayer = !!me && !!lobby?.players.some((player) => player._id === me);
  const turnDeadline = lobby?.turnDeadline;
  const showScoreAnimation =
    lobby?.step === step.scoreAdditionAnimation && resultPhase === 'score';
  const showAttackAnimation =
    lobby?.step === step.scoreAdditionAnimation && resultPhase === 'attack';
  const showDamageAnimation =
    lobby?.step === step.scoreAdditionAnimation && resultPhase === 'damage';
  // Only while the active player has to act: during the result animations the
  // deadline is just a safety net in case they never pass the turn.
  const showTimer = !!turnDeadline && !!lobby && PLAYING_STEPS.includes(lobby.step);

  // Every turn's result sequence starts over from the score animation.
  useEffect(() => {
    if (lobby?.step !== step.scoreAdditionAnimation) {
      setResultPhase('score');
      setHpRevealed(false);
    }
  }, [lobby?.step]);

  // Remember the HP while the turn isn't resolved yet: when the resolution
  // arrives, these are the HP to keep showing until the damage pops up.
  useEffect(() => {
    if (lobby && lobby.step !== step.scoreAdditionAnimation) {
      hpBeforeResolution.current = Object.fromEntries(
        lobby.players.map((player) => [player._id, player.hp]),
      );
    }
  }, [lobby]);

  useTurnTimeout({ id, user, isPlayer, turnDeadline, clockOffset });

  /**
   * Toggles the selection of a dice when clicked.
   *
   * @param {number} value - The value of the dice being clicked.
   * @returns {void} This function does not return a value.
   */
  const selectDice = (value: number): void => {
    if (selectedDices.includes(value))
      setSelectedDices(selectedDices.filter((number) => number !== value));
    else setSelectedDices([...selectedDices, value]);
  };

  /**
   * Locks the selected dices for the current user by sending a request to the backend service.
   */
  const lockSelectedDices = (): void => {
    if (!id || !user || selectedDices.length === 0) return;
    // TODO faire tout pour etre sur que le back nous retourne pas une erreur (dans le sens ou l'animation doit etre une "validation" que ç'a bien marché normalement IKEK)
    // TODO genre la actuellement ça serai de check si c'est bien un tableau de chiffre et en fonction des chiffres qu'on nous donne que ça soit dedans
    // je comprends pas mes anciens TODOs IKEK

    changeGameStep(user, id, step.lockAnimation);

    // Whether this is the 6th/final lock (score/attack resolution vs. just
    // rerolling) is entirely determined server-side (game.step becomes
    // 'scoreAdditionAnimation' vs 'none'). Passing the turn to the next
    // player is triggered once the resulting animation sequence actually
    // finishes playing (see handleScoreAnimationEnd/finishResult below)
    // rather than a fixed timer, so it can't fire before or after the
    // animations the player is actually watching.
    setTimeout(() => {
      lockDices(user, id, selectedDices);
      setSelectedDices([]);
    }, 1400); // TODO revoir cette valeur (un peu long)
  };

  // End of the result sequence. Only the active player passes the turn; the
  // others just wait for the update (or for the turn deadline if they left).
  const finishResult = (): void => {
    setResultPhase('done');
    setHpRevealed(true);
    if (isMyTurn && user && id) endTurn(user, id);
  };

  const score = activePlayer?.lockedDices?.reduce((sum, value) => sum + value, 0) ?? 0;
  const attackNumber = score - 30;

  // Called once the score-sum animation (DicesResultsAnimation) finishes:
  // show the attack or the damage taken next, before passing the turn (at
  // exactly 30 nothing happens, the turn is over already).
  const handleScoreAnimationEnd = (): void => {
    if (activePlayer?.attackDices && activePlayer.attackDices.length > 0) {
      setResultPhase('attack');
    } else if (score < 30) {
      setResultPhase('damage');
    } else {
      finishResult();
    }
  };

  const launchedTitle = showAttackAnimation
    ? `Chiffre d'attaque : ${attackNumber}`
    : showDamageAnimation
      ? `Il manquait ${30 - score} points pour faire 30`
      : 'Dés lancés';

  // TODO faire pour que le joueur mort soit en bas de la liste
  // TODO faire que le joueur mort puisse pas jouer ikek
  // TODO faire que si qu'un joueur est vivant, il gagne

  return (
    <div className={styles.Board}>
      {myPlayer && <LowHealthVignette hp={displayed(myPlayer).hp} maxHp={lobby?.maxHp ?? 30} />}
      <div className={styles.dicesBox}>
        <ActivePlayerBadge
          key={activePlayer?.username}
          player={shownActivePlayer}
          maxHp={lobby?.maxHp ?? 30}
          hurt={showDamageAnimation}
        />
        {showTimer && turnDeadline && (
          <div className={styles.timerSlot}>
            <TurnTimer
              deadline={turnDeadline}
              clockOffset={clockOffset}
              isMyTurn={isMyTurn}
              username={activePlayer?.username ?? ''}
            />
          </div>
        )}
        <div className={styles.dicesContainer}>
          <div className={styles.dicesLaunched}>
            <p className={styles.boxTitle}>{launchedTitle}</p>
            <div className={styles.dices} ref={dicesRowRef}>
              {showAttackAnimation && activePlayer?.attackDices && (
                <AttackAnimation
                  attackDices={activePlayer.attackDices}
                  attackNumber={attackNumber}
                  onHit={() => setHpRevealed(true)}
                  onAnimationEnd={finishResult}
                  rowRef={dicesRowRef}
                />
              )}
              {showDamageAnimation && (
                <DamageAnimation
                  score={score}
                  onHit={() => setHpRevealed(true)}
                  onAnimationEnd={finishResult}
                />
              )}
            </div>
            {/* Thrown from the far end of this box, landing in the row above. */}
            <Dices3D
              dices={
                !showAttackAnimation &&
                !showDamageAnimation &&
                (lobby?.step === step.dices || lobby?.step === step.lockAnimation)
                  ? (activePlayer?.dices ?? null)
                  : null
              }
              selected={selectedDices}
              locking={lobby?.step === step.lockAnimation}
              interactive={isMyTurn}
              onToggle={selectDice}
              rowRef={dicesRowRef}
            />
          </div>
          <div className={styles.dicesLocked}>
            <p className={styles.boxTitle}>Dés verrouillés</p>
            <div className={styles.dices} ref={lockedRowRef} />
            <Dices3D
              dices={activePlayer?.lockedDices?.length ? activePlayer.lockedDices : null}
              selected={NO_SELECTION}
              locking={false}
              interactive={false}
              animated={false}
              rowRef={lockedRowRef}
            />
          </div>
        </div>
        {lobby?.step === step.none && isMyTurn && (
          <button
            className={styles.rollButton}
            onClick={() => {
              if (id && user) changeGameStep(user, id, step.dices);
            }}
          >
            Roll the dices 🎲
          </button>
        )}
        {lobby?.step === step.dices && isMyTurn && (
          <LockButton hasSelection={selectedDices.length > 0} onLock={lockSelectedDices} />
        )}
      </div>
      <div className={styles.playersBox}>
        {lobby?.players?.map((player, index) => {
          if (player.index === activePlayer?.index) return;
          return (
            <PlayerComponent key={index} player={displayed(player)} maxHp={lobby.maxHp} />
          );
        })}
      </div>
      {showScoreAnimation && (
        <DicesResultsAnimation
          dices={activePlayer?.lockedDices?.length === 6 ? activePlayer?.lockedDices : []}
          onAnimationEnd={handleScoreAnimationEnd}
        />
      )}
    </div>
  );
};

export default Board;
