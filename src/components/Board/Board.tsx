import { RootState } from '@/store/store';
import { useState } from 'react';
import { useSelector } from 'react-redux';

// Service
import { changeGameStep, endTurn, lockDices } from '@/services/services';

// Styles
import styles from './Board.module.css';

// Types
import { Player, step } from '@/types/gameType';

// Store
import { getUser } from '@/store/slices/clientSlice';
import { selectActivePlayer } from '@/store/slices/gameSlice';

// Components
import AttackAnimation from '../AttackAnimation/AttackAnimation';
import DiceLockAnimation from '../DiceLockAnimation/DiceLockAnimation';
import DicesResultsAnimation from '../DicesResultsAnimation/DicesResultsAnimation';
import PlayerComponent from '../Player/Player';

const Board = () => {
  const [selectedDices, setSelectedDices] = useState<number[]>([]);
  const [showAttackAnimation, setShowAttackAnimation] = useState(false);

  const user = useSelector((state: RootState) => getUser(state));
  const id = useSelector((state: RootState) => state.game.game?._id);
  const lobby = useSelector((state: RootState) => state.game.game);
  const activePlayer: Player | null = useSelector((state: RootState) =>
    selectActivePlayer(state.game),
  );

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

    changeGameStep(id, step.lockAnimation);

    // Whether this is the 6th/final lock (score/attack resolution vs. just
    // rerolling) is entirely determined server-side (game.step becomes
    // 'scoreAdditionAnimation' vs 'none'). Passing the turn to the next
    // player is triggered once the resulting animation sequence actually
    // finishes playing (see handleScoreAnimationEnd/handleAttackAnimationEnd
    // below) rather than a fixed timer, so it can't fire before or after the
    // animations the player is actually watching.
    setTimeout(() => {
      lockDices(user, id, selectedDices);
      setSelectedDices([]);
    }, 1400); // TODO revoir cette valeur (un peu long)
  };

  // Called once the score-sum animation (DicesResultsAnimation) finishes.
  // If this lock resolved into an attack, show that sequence next before
  // passing the turn; otherwise (a plain HP loss) the turn is over already.
  const handleScoreAnimationEnd = (): void => {
    if (activePlayer?.attackDices && activePlayer.attackDices.length > 0) {
      setShowAttackAnimation(true);
    } else if (user && id) {
      endTurn(user, id);
    }
  };

  const handleAttackAnimationEnd = (): void => {
    setShowAttackAnimation(false);
    if (user && id) endTurn(user, id);
  };

  const attackNumber = (activePlayer?.lockedDices?.reduce((sum, value) => sum + value, 0) ?? 0) - 30;

  // TODO faire pour que le joueur mort soit en bas de la liste
  // TODO faire que le joueur mort puisse pas jouer ikek
  // TODO faire que si qu'un joueur est vivant, il gagne
  // TODO faire des animations de perte d'hp

  return (
    <div className={styles.Board}>
      <div className={styles.dicesBox}>
        <div className={styles.activePlayer} key={`${activePlayer?.username}`}>
          <p>🙍‍♂️</p>
          <p>{activePlayer?.username}</p>
          <p>
            {activePlayer?.hp} <span className={styles.heart}>❤</span>
          </p>
        </div>
        {/** TODO remplacer ces buttons par des dés 3d avec Three.js et si possible avec une animation quand ils arrivent comme google mais avec des vrais points de des et faire quils aient des placement aleatoire comme sur un vrai jeu de des*/}
        <div className={styles.dicesContainer}>
          <div className={styles.dicesLaunched}>
            <p>{showAttackAnimation ? `Chiffre d'attaque : ${attackNumber}` : 'Dés lancés: '}</p>
            <div className={styles.dices}>
              {!showAttackAnimation &&
                (lobby?.step === step.dices || lobby?.step === step.lockAnimation) &&
                activePlayer?.dices?.map((data, index) => {
                  const isMyTurn = user?.id === activePlayer?._id;
                  return (
                    <button
                      className={`${styles.dice} ${
                        selectedDices.includes(index) ? styles.diceSelected : ''
                      }`}
                      onClick={isMyTurn ? () => selectDice(index) : undefined}
                      disabled={!isMyTurn}
                      key={`${data}-${index}`}
                    >
                      {data}
                      <DiceLockAnimation
                        show={selectedDices.includes(index) && lobby?.step === step.lockAnimation}
                      />
                    </button>
                  );
                })}
              {showAttackAnimation && activePlayer?.attackDices && (
                <AttackAnimation
                  attackDices={activePlayer.attackDices}
                  attackNumber={attackNumber}
                  onAnimationEnd={handleAttackAnimationEnd}
                />
              )}
            </div>
          </div>
          <div className={styles.dicesLocked}>
            <p>Dés vérrouillé:</p>
            <div className={styles.dices}>
              {activePlayer?.lockedDices?.map((data, index) => {
                return (
                  <p className={styles.dice} key={`${data}-${index}`}>
                    {data}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
        {lobby?.step === step.none && user?.id === activePlayer?._id && (
          <button
            className={styles.rollButton}
            onClick={() => {
              if (id) changeGameStep(id, step.dices);
            }}
          >
            Roll the dices 🎲
          </button>
        )}
        {lobby?.step === step.dices && user?.id === activePlayer?._id && (
          <button className={styles.lockButton} onClick={lockSelectedDices}>
            Lock the dices 🔒
          </button>
        )}
      </div>
      <div className={styles.playersBox}>
        {lobby?.players?.map((player, index) => {
          if (player.index === activePlayer?.index) return;
          return <PlayerComponent key={index} player={player} />;
        })}
      </div>
      {lobby?.step === step.scoreAdditionAnimation && !showAttackAnimation && (
        <DicesResultsAnimation
          dices={activePlayer?.lockedDices?.length === 6 ? activePlayer?.lockedDices : []}
          onAnimationEnd={handleScoreAnimationEnd}
        />
      )}
    </div>
  );
};

export default Board;
