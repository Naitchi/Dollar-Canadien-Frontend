import { RootState } from '@/store/store';
import dynamic from 'next/dynamic';
import { KeyboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Service
import { changeGameStep, endTurn, lockDices } from '@/services/services';

// Styles
import frame from '../layout/GameFrame.module.css';
import surface from '../ui/Surface.module.css';
import styles from './Board.module.css';

// Types
import { Player, step } from '@/types/gameType';

// Functions
import { LOCK_DELAY_MS } from '@/constants/timings';
import { withDisplayedHp } from '@/functions/functions';
import {
  HpChange,
  dieShortcutIndex,
  hpChanges,
  nextPlayerId,
  outcomeFor,
  projectionHint,
  railOrder,
  turnProjection,
} from '@/functions/game';
import { vibrate } from '@/functions/prefs';

// Store
import { getClockOffset, getMe, getUser } from '@/store/slices/clientSlice';
import { selectActivePlayer } from '@/store/slices/gameSlice';

// Hooks
import { useTableAvatars } from '@/hooks/useTableAvatars';
import { useTurnTimeout } from './useTurnTimeout';

// Components
import { useAnnounce } from '../Announcer/Announcer';
import AttackAnimation, { AttackProgress } from '../AttackAnimation/AttackAnimation';
import DamageAnimation from '../DamageAnimation/DamageAnimation';
import DicesResultsAnimation from '../DicesResultsAnimation/DicesResultsAnimation';
import LowHealthVignette from '../LowHealthVignette/LowHealthVignette';
import { useSecondsLeft } from '../TurnTimer/TurnTimer';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import LockedTray from './LockedTray';
import { PlayerRail, PlayerStrip } from './Players';
import TurnCard from './TurnCard';
import TurnSlam from './TurnSlam';

// three.js is heavy: only downloaded once the game starts (this board is
// mounted), which is well before the first throw, and never on the server.
const Dices3D = dynamic(() => import('../Dices3D/Dices3D'), { ssr: false });

// Where we are in the result sequence of the current turn, once the server
// has resolved it (step `scoreAdditionAnimation`): score sum animation, then
// the attack (above 30) or the damage taken (below 30), then nothing until
// the next turn.
type ResultPhase = 'score' | 'attack' | 'damage' | 'done';

// Steps during which the active player still has to act (roll or lock).
const PLAYING_STEPS: step[] = [step.none, step.dices, step.lockAnimation];

// Actions are fire-and-forget (the result comes back through Pusher): if the
// step hasn't moved after this long, check with the server, then let the
// player try again.
const ACTION_TIMEOUT_MS = 8000;

// How long the "choose at least one die" hint stays up.
const HINT_DURATION_MS = 2500;

interface BoardProps {
  // Fetches the game again (see game.tsx).
  onResync: () => Promise<void>;
  // Our own elimination was just revealed (the page plays the heart break).
  onMyDeath: () => void;
}

const Board = ({ onResync, onMyDeath }: BoardProps) => {
  const announce = useAnnounce();
  const [selectedDices, setSelectedDices] = useState<number[]>([]);
  const [resultPhase, setResultPhase] = useState<ResultPhase>('score');
  // Whether the damage of the turn being animated has popped up yet (see displayed HP below).
  const [hpRevealed, setHpRevealed] = useState(false);
  // Everyone's HP before the current turn was resolved.
  const hpBeforeResolution = useRef<Record<string, number>>({});
  // Row where the 3D dice land.
  const dicesRowRef = useRef<HTMLDivElement>(null);

  const [pending, setPending] = useState<'roll' | 'lock' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  // Who lost HP in the turn being animated, once revealed.
  const [hits, setHits] = useState<HpChange[] | null>(null);
  const [attackProgress, setAttackProgress] = useState<AttackProgress | null>(null);
  const [slamKey, setSlamKey] = useState(0);

  const ctaRef = useRef<HTMLButtonElement>(null);
  const turnHeadingRef = useRef<HTMLHeadingElement>(null);
  const hintTimeout = useRef<ReturnType<typeof setTimeout>>();
  const pendingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lockTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lockGuard = useRef<ReturnType<typeof setTimeout>>();

  const user = useSelector((state: RootState) => getUser(state));
  const me = useSelector((state: RootState) => getMe(state));
  const clockOffset = useSelector((state: RootState) => getClockOffset(state));
  const id = useSelector((state: RootState) => state.game.game?._id);
  const lobby = useSelector((state: RootState) => state.game.game);
  const activePlayer: Player | null = useSelector((state: RootState) => selectActivePlayer(state.game));
  const avatars = useTableAvatars();

  const isMyTurn = !!me && me === activePlayer?._id;
  const currentStep = lobby?.step;
  const maxHp = lobby?.maxHp ?? 30;
  // The server applies the damage as soon as the turn is resolved: until the
  // damage pops up in the animation, keep showing the HP from before (in the
  // cards, the hearts, the sort order, the danger badges and the red edges).
  const hideNewHp = currentStep === step.scoreAdditionAnimation && !hpRevealed;
  const displayed = (player: Player): Player => withDisplayedHp(player, hpBeforeResolution.current, hideNewHp);
  const shownPlayers = (lobby?.players ?? []).map(displayed);
  const myPlayer = lobby?.players.find((player) => player._id === me);
  const myShown = myPlayer && displayed(myPlayer);
  const isPlayer = !!myPlayer;
  const iAmOut = !!myShown && myShown.hp <= 0;
  const turnDeadline = lobby?.turnDeadline;
  const inResult = currentStep === step.scoreAdditionAnimation;
  const showScoreAnimation = inResult && resultPhase === 'score';
  const showAttackAnimation = inResult && resultPhase === 'attack';
  const showDamageAnimation = inResult && resultPhase === 'damage';
  // Only while the active player has to act: during the result animations the
  // deadline is just a safety net in case they never pass the turn.
  const showTimer = !!turnDeadline && !!lobby && PLAYING_STEPS.includes(lobby.step);
  const showCta = isMyTurn && !!currentStep && PLAYING_STEPS.includes(currentStep);
  const nextId = nextPlayerId(shownPlayers, lobby?.actif ?? null);
  const nextPlayer = shownPlayers.find((player) => player._id === nextId);
  const dicesKey = activePlayer?.dices?.join(',') ?? '';
  const hitIds = useMemo(() => new Set((hits ?? []).map((change) => change.player._id)), [hits]);
  const timeLeft = useSecondsLeft(showCta ? turnDeadline : null, clockOffset);

  // Phones: the main button sticks to the bottom of the screen; the page
  // scrolls focused elements above it (WCAG 2.4.11, see globals.css).
  useEffect(() => {
    if (!showCta) return;
    document.documentElement.classList.add('sticky-cta');
    return () => document.documentElement.classList.remove('sticky-cta');
  }, [showCta]);

  // Latest values for timeouts and callbacks bound earlier.
  const latest = useRef({ currentStep, actif: lobby?.actif, lobby, me });
  latest.current = { currentStep, actif: lobby?.actif, lobby, me };

  // Every turn's result sequence starts over from the score animation.
  useEffect(() => {
    if (lobby?.step !== step.scoreAdditionAnimation) {
      setResultPhase('score');
      setHpRevealed(false);
      setHits(null);
      setAttackProgress(null);
    }
  }, [lobby?.step]);

  // Remember the HP while the turn isn't resolved yet: when the resolution
  // arrives, these are the HP to keep showing until the damage pops up.
  useEffect(() => {
    if (lobby && lobby.step !== step.scoreAdditionAnimation) {
      hpBeforeResolution.current = Object.fromEntries(lobby.players.map((player) => [player._id, player.hp]));
    }
  }, [lobby]);

  useTurnTimeout({ id, user, isPlayer, turnDeadline, clockOffset });

  // The server answered (the step or the turn moved on): the action went through.
  useEffect(() => {
    setPending(null);
    clearTimeout(pendingTimeout.current);
  }, [lobby?.step, lobby?.actif]);

  useEffect(
    () => () => {
      clearTimeout(hintTimeout.current);
      clearTimeout(pendingTimeout.current);
      clearTimeout(lockGuard.current);
    },
    [],
  );

  // A new turn: announce it; ours also gets the slam, a vibration and the focus.
  const previousActif = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const actif = lobby?.actif;
    if (previousActif.current === actif) return;
    const firstRender = previousActif.current === undefined;
    previousActif.current = actif;
    if (!actif || !activePlayer) return;
    setSelectedDices([]);
    if (actif === me) {
      announce("C'est ton tour ! Lance les dés.", 'assertive');
      setSlamKey((key) => key + 1);
      if (!firstRender) vibrate([90, 60, 90]);
    } else if (!firstRender) {
      announce(`Au tour de ${activePlayer.username}.`);
    }
    // Only when the turn changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobby?.actif]);

  // New dice on the mat: say them.
  useEffect(() => {
    if (currentStep !== step.dices || !activePlayer?.dices?.length) return;
    const who = isMyTurn ? 'Tu as lancé' : `${activePlayer.username} a lancé`;
    announce(`${who} : ${activePlayer.dices.join(', ')}.`);
    // Only when the dice change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, dicesKey]);

  // One die left: nothing to choose, it's selected already (still toggleable).
  useEffect(() => {
    if (isMyTurn && currentStep === step.dices && activePlayer?.dices?.length === 1) {
      setSelectedDices([0]);
      announce('Dernier dé : il est déjà choisi. Garde-le pour compter ton score.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurn, currentStep, dicesKey]);

  // When the main button goes away (end of our turn) while it had the focus,
  // the focus goes to the turn heading instead of the top of the page.
  const hadCta = useRef(false);
  useEffect(() => {
    if (hadCta.current && !showCta) {
      const active = document.activeElement;
      if (!active || active === document.body) turnHeadingRef.current?.focus();
    }
    hadCta.current = showCta;
  }, [showCta]);

  // The dice buttons disappear after each throw: don't drop the focus to the
  // top of the page, give it to the main button (not on the first render:
  // arriving on the page must not move the focus).
  const stepSeen = useRef(false);
  useEffect(() => {
    if (!stepSeen.current) {
      stepSeen.current = true;
      return;
    }
    if (showCta && document.activeElement === document.body) ctaRef.current?.focus({ preventScroll: true });
  }, [currentStep, showCta]);

  const armPendingTimeout = (stepBefore: step | undefined, delay: number) => {
    clearTimeout(pendingTimeout.current);
    pendingTimeout.current = setTimeout(async () => {
      await onResync();
      if (latest.current.currentStep === stepBefore) {
        setPending(null);
        setActionError("Ça n'a pas marché. Réessaie.");
        announce("Ça n'a pas marché. Réessaie.", 'assertive');
      }
    }, delay);
  };

  const flashHint = () => {
    setShowHint(true);
    announce('Choisis au moins 1 dé à garder.', 'assertive');
    clearTimeout(hintTimeout.current);
    hintTimeout.current = setTimeout(() => setShowHint(false), HINT_DURATION_MS);
  };

  /**
   * Toggles the selection of a dice when clicked.
   *
   * @param {number} index - The index of the dice being clicked (the server locks by index).
   * @returns {void} This function does not return a value.
   */
  const selectDice = (index: number): void => {
    setShowHint(false);
    setActionError(null);
    if (selectedDices.includes(index)) setSelectedDices(selectedDices.filter((number) => number !== index));
    else setSelectedDices([...selectedDices, index]);
  };

  const rollDices = (): void => {
    // Never sent twice (pending), nor at the wrong moment.
    if (pending || !id || !user || !isMyTurn || currentStep !== step.none) return;
    setPending('roll');
    setActionError(null);
    changeGameStep(user, id, step.dices);
    armPendingTimeout(step.none, ACTION_TIMEOUT_MS);
  };

  /**
   * Locks the selected dices for the current user by sending a request to the backend service.
   */
  const lockSelectedDices = (): void => {
    if (pending || !id || !user || !isMyTurn || currentStep !== step.dices) return;
    if (selectedDices.length === 0) {
      flashHint();
      return;
    }
    const selection = selectedDices;
    setPending('lock');
    setActionError(null);
    changeGameStep(user, id, step.lockAnimation);

    // Whether this is the 6th/final lock (score/attack resolution vs. just
    // rerolling) is entirely determined server-side (game.step becomes
    // 'scoreAdditionAnimation' vs 'none'). Passing the turn to the next
    // player is triggered once the resulting animation sequence actually
    // finishes playing (see handleScoreAnimationEnd/finishResult below)
    // rather than a fixed timer, so it can't fire before or after the
    // animations the player is actually watching.
    // Deliberately not cleared on unmount: the lock must still go out.
    clearTimeout(lockTimeout.current);
    lockTimeout.current = setTimeout(() => {
      lockDices(user, id, selection);
      setSelectedDices([]);
      // If that request got lost, we'd sit on "Verrouillage…" until the
      // server's deadline locks ALL the remaining dice. Check with the
      // server, then send the same selection once more (still accepted in
      // that step; refused harmlessly once the lock went through).
      clearTimeout(lockGuard.current);
      lockGuard.current = setTimeout(async () => {
        if (latest.current.currentStep !== step.lockAnimation) return;
        await onResync();
        if (latest.current.currentStep === step.lockAnimation) lockDices(user, id, selection);
      }, ACTION_TIMEOUT_MS);
    }, LOCK_DELAY_MS);
    armPendingTimeout(step.dices, LOCK_DELAY_MS + ACTION_TIMEOUT_MS);
  };

  // End of the result sequence. Only the active player passes the turn; the
  // others just wait for the update (or for the turn deadline if they left).
  const finishResult = (): void => {
    setResultPhase('done');
    setHpRevealed(true);
    if (isMyTurn && user && id) endTurn(user, id);
  };

  // The damage pops up: show the new HP, name who got hit, and play our own
  // death if it's ours (unless it ends the game: the results take over).
  const revealHits = (): void => {
    setHpRevealed(true);
    const current = latest.current.lobby;
    // Arrived (or refreshed) in the middle of this turn's animation: we never
    // saw the HP from before, so we can't say who lost what. Say nothing
    // rather than something wrong (the damage badge still shows the loss).
    if (!current || Object.keys(hpBeforeResolution.current).length === 0) return;
    const changes = hpChanges(hpBeforeResolution.current, current.players);
    setHits(changes);
    announce(
      changes.length
        ? changes
            .map((change) =>
              change.ko
                ? `${change.player.username} perd ${change.lost} PV et est K.O.`
                : `${change.player.username} perd ${change.lost} PV`,
            )
            .join('. ') + '.'
        : "Personne n'est touché.",
    );
    const myId = latest.current.me;
    const alive = current.players.filter((player) => player.hp > 0).length;
    if (myId && alive > 1 && changes.some((change) => change.player._id === myId && change.ko)) onMyDeath();
  };

  const score = activePlayer?.lockedDices?.reduce((sum, value) => sum + value, 0) ?? 0;
  const attackNumber = score - 30;

  // Called once the score-sum animation (DicesResultsAnimation) finishes:
  // show the attack or the damage taken next, before passing the turn (at
  // exactly 30 nothing happens, the turn is over already).
  const handleScoreAnimationEnd = (): void => {
    const outcome = outcomeFor(score);
    const name = isMyTurn ? 'Ton score' : `Score de ${activePlayer?.username}`;
    announce(
      `${name} : ${score}. ${
        outcome.kind === 'attack'
          ? `Attaque de ${outcome.attackNumber} !`
          : outcome.kind === 'damage'
            ? `${outcome.amount} PV en moins.`
            : 'Pile 30 : rien ne se passe.'
      }`,
    );
    if (activePlayer?.attackDices && activePlayer.attackDices.length > 0) {
      setResultPhase('attack');
    } else if (score < 30) {
      setResultPhase('damage');
    } else {
      finishResult();
    }
  };

  const handleMatKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isMyTurn || currentStep !== step.dices) return;
    const index = dieShortcutIndex(event.nativeEvent);
    if (index === null || index >= (activePlayer?.dices?.length ?? 0)) return;
    event.preventDefault();
    selectDice(index);
  };

  // What the turn would give with the dice selected right now.
  const projection = turnProjection(activePlayer?.lockedDices, activePlayer?.dices, isMyTurn ? selectedDices : []);
  const remainingToThrow = 6 - projection.lockedCount;

  // The one main button: its label follows the step (the focus never drops).
  let ctaLabel: ReactNode = '';
  let ctaIcon: 'dice' | 'lock' = 'dice';
  let ctaUnavailable = false;
  let ctaPending = !!pending;
  let ctaAction = rollDices;
  if (currentStep === step.none) {
    ctaLabel = remainingToThrow === 6 ? 'Lancer les dés' : `Lancer ${remainingToThrow} dé${remainingToThrow > 1 ? 's' : ''}`;
  } else if (currentStep === step.dices) {
    ctaAction = lockSelectedDices;
    ctaIcon = 'lock';
    if (projection.selectedCount === 0) {
      ctaLabel = 'Choisis au moins 1 dé';
      ctaUnavailable = true;
    } else {
      const head = projection.isFinal
        ? 'Garder et compter'
        : `Garder ${projection.selectedCount} dé${projection.selectedCount > 1 ? 's' : ''}`;
      // Seen "Garder 2 dés · 28", heard "Garder 2 dés, total 28" (the visible
      // words stay in the accessible name, for voice control).
      ctaLabel = (
        <>
          {head} <span aria-hidden="true">·</span>
          <span className="sr-only">, total</span> {projection.total}
        </>
      );
    }
  } else if (currentStep === step.lockAnimation) {
    ctaLabel = 'Verrouillage…';
    ctaIcon = 'lock';
    ctaPending = true;
  }

  // Under 10 s, the helper warns what happens at 0 (phones never show tooltips).
  const timeWarning =
    timeLeft !== null && timeLeft <= 10
      ? timeLeft === 0
        ? 'Temps écoulé : tes dés restants vont être gardés automatiquement.'
        : `Dans ${timeLeft} s, tes dés restants seront gardés automatiquement.`
      : null;
  const helper = actionError
    ? actionError
    : showHint
      ? 'Choisis au moins 1 dé à garder.'
      : timeWarning
        ? timeWarning
        : currentStep === step.none
        ? projection.lockedCount === 0
          ? 'Tu dois garder au moins 1 dé à chaque lancer.'
          : `${projection.lockedCount}/6 dés gardés · total ${projection.lockedSum}`
        : currentStep === step.dices
          ? (projectionHint(projection) ?? 'Touche les dés à garder, puis valide.')
          : 'Tes dés sont verrouillés…';

  const activeName = activePlayer?.username ?? '…';
  // Says something the turn card doesn't (spectators and eliminated players
  // already have their banner above).
  const statusText = inResult
    ? resultPhase === 'done'
      ? 'Le tour passe bientôt au suivant.'
      : 'Résultat dans un instant…'
    : isPlayer && !iAmOut
      ? nextId === me
        ? "Prépare-toi : c'est toi ensuite !"
        : 'En attente de ton tour…'
      : 'Profite du spectacle !';

  const trayOwner = isMyTurn ? 'Tes dés gardés' : `Dés gardés par ${activeName}`;
  const matHasDice =
    !showAttackAnimation &&
    !showDamageAnimation &&
    (currentStep === step.dices || currentStep === step.lockAnimation) &&
    !!activePlayer?.dices?.length;

  return (
    <div className={`${frame.page} ${styles.page}`}>
      {myShown && <LowHealthVignette hp={myShown.hp} maxHp={maxHp} />}
      {slamKey > 0 && <TurnSlam key={slamKey} />}

      <div className={frame.frame}>
        <aside className={`${frame.sidebar} ${styles.rail}`} aria-label="Joueurs">
          <PlayerRail
            players={railOrder(shownPlayers)}
            avatars={avatars}
            maxHp={maxHp}
            me={me}
            activeId={lobby?.actif ?? null}
            nextId={nextId}
            hitIds={hitIds}
          />
        </aside>

        <div className={`${frame.main} ${styles.main}`}>
          <PlayerStrip
            players={railOrder(shownPlayers)}
            avatars={avatars}
            maxHp={maxHp}
            me={me}
            activeId={lobby?.actif ?? null}
            nextId={nextId}
            hitIds={hitIds}
          />

          <TurnCard
            activeName={activeName}
            isMyTurn={isMyTurn}
            currentStep={currentStep}
            inResult={inResult}
            lockedCount={projection.lockedCount}
            nextName={nextPlayer ? (nextPlayer._id === me ? 'toi' : nextPlayer.username) : null}
            deadline={turnDeadline}
            showTimer={showTimer}
            clockOffset={clockOffset}
            headingRef={turnHeadingRef}
          />

          {(!isPlayer || iAmOut) && (
            <p className={styles.spectator}>
              <Icon name="eye" size={20} />
              {!isPlayer
                ? 'La partie avait déjà commencé : tu regardes en spectateur.'
                : "T'es K.O. : tu regardes la fin de la partie en spectateur."}
            </p>
          )}

          <div className={`${surface.board} ${styles.board}`}>
            <section className={styles.matSection} aria-labelledby="mat-title">
              <div className={styles.sectionHead}>
                <h2 id="mat-title" className={surface.sectionTitle}>
                  <span className={surface.dot} style={{ background: 'var(--c-green)' }} aria-hidden="true" />
                  Dés sur le tapis
                </h2>
                {isMyTurn && currentStep === step.dices && (
                  <p className={styles.sectionHint}>
                    Touche un dé pour le choisir
                    <span className={styles.kbd} aria-hidden="true">
                      1–6
                    </span>
                  </p>
                )}
              </div>

              {/* The 3D stage covers this mat; the dice land in the row below. */}
              <div className={styles.mat} onKeyDown={handleMatKey} role="group" aria-label="Dés lancés">
                <div className={styles.row} ref={dicesRowRef}>
                  {showAttackAnimation && activePlayer?.attackDices && (
                    <AttackAnimation
                      attackDices={activePlayer.attackDices}
                      attackNumber={attackNumber}
                      onHit={revealHits}
                      onProgress={setAttackProgress}
                      onAnimationEnd={finishResult}
                      rowRef={dicesRowRef}
                    />
                  )}
                  {showDamageAnimation && (
                    <DamageAnimation score={score} onHit={revealHits} onAnimationEnd={finishResult} />
                  )}
                  {!matHasDice && !showAttackAnimation && !showDamageAnimation && (
                    <p className={styles.matEmpty}>
                      {inResult
                        ? resultPhase === 'done'
                          ? 'Tour terminé : au suivant !'
                          : 'On compte les points…'
                        : isMyTurn
                          ? currentStep === step.none
                            ? 'Lance les dés !'
                            : ''
                          : 'En attente des dés…'}
                    </p>
                  )}
                </div>
                {/* Thrown from the far end of this mat, landing in the row above. */}
                <Dices3D
                  dices={matHasDice ? (activePlayer?.dices ?? null) : null}
                  selected={selectedDices}
                  locking={currentStep === step.lockAnimation}
                  interactive={isMyTurn && currentStep === step.dices}
                  onToggle={selectDice}
                  rowRef={dicesRowRef}
                />
              </div>

              {showAttackAnimation && attackProgress && !hits && (
                <p className={styles.attackBar}>
                  <Icon name="sword" size={18} />
                  <span>
                    Il faut des <strong>{attackNumber}</strong> · relance {attackProgress.round}
                  </span>
                  <span className={styles.attackCount}>
                    {attackProgress.hits} touche{attackProgress.hits > 1 ? 's' : ''} · {attackProgress.damage} dégâts
                  </span>
                </p>
              )}
              {hits && (
                <ul role="list" className={styles.hitList}>
                  {hits.length === 0 ? (
                    <li className={styles.hitNone}>Personne n&apos;est touché.</li>
                  ) : (
                    hits.map((change) => (
                      <li key={change.player._id} className={styles.hit}>
                        <strong>{change.player._id === me ? 'Toi' : change.player.username}</strong>
                        <span className={styles.hitAmount}>−{change.lost} PV</span>
                        {change.ko && <span className={styles.hitKo}>K.O.</span>}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </section>

            <LockedTray
              locked={activePlayer?.lockedDices ?? []}
              selectedSum={currentStep === step.dices ? projection.selectedSum : 0}
              owner={trayOwner}
            />

            <div className={styles.actions}>
              {showCta ? (
                <>
                  <Button
                    ref={ctaRef}
                    variant="primary"
                    size="xl"
                    block
                    iconPill={ctaIcon === 'lock' ? 'lock' : 'dice'}
                    onClick={ctaAction}
                    unavailable={ctaUnavailable}
                    pending={ctaPending}
                    aria-describedby="cta-helper"
                  >
                    {ctaLabel}
                  </Button>
                  <p
                    id="cta-helper"
                    className={`${styles.helper} ${showHint || actionError || timeWarning ? styles.helperAlert : ''}`}
                  >
                    {helper}
                  </p>
                </>
              ) : (
                <p className={styles.waiting}>
                  <Icon name="clock" size={20} />
                  {statusText}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showScoreAnimation && (
        <DicesResultsAnimation
          dices={activePlayer?.lockedDices?.length === 6 ? activePlayer?.lockedDices : []}
          name={isMyTurn ? 'Ton score' : `Score de ${activeName}`}
          onAnimationEnd={handleScoreAnimationEnd}
        />
      )}
    </div>
  );
};

export default Board;
