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
import DiceLockAnimation from '../DiceLockAnimation/DiceLockAnimation';
import DicesResultsAnimation from '../DicesResultsAnimation/DicesResultsAnimation';

const Board = () => {
  const [selectedDices, setSelectedDices] = useState<number[]>([]);

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
    // TODO faire pour tout pour etre sur que le back nous retourne pas une erreur (dans le sens ou l'animation doit etre une "validation" que ç'a bien marché normalement IKEK)
    // TODO genre la actuellement ça serai de check si c'est bien un tableau de chiffre et en fonction des chiffres qu'on nous donne que ça soit dedans
    // je comprends pas mes anciens TODOs IKEK

    // TODO les gens on pas celle la
    changeGameStep(id, step.lockAnimation);

    setTimeout(() => {
      if (
        activePlayer?.lockedDices?.length
          ? activePlayer?.lockedDices?.length + selectedDices.length === 6
          : selectedDices.length === 6
      ) {
        lockDices(user, id, selectedDices);
        setTimeout(() => {
          endTurn(user, id);
          setSelectedDices([]);
        }, 7000); // TODO revoir cette valeur
      } else {
        changeGameStep(id, step.none);
        lockDices(user, id, selectedDices);
        setSelectedDices([]);
      }
    }, 1400); // TODO revoir cette valeur (un peu long)
  };

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
        {/** TODO remplacer ces buttons par des dés 3d avec Three.js et si possible avec une animation quand ils arrivent comme google mais avec des vrais points de des*/}
        <div className={styles.dicesContainer}>
          <div className={styles.dicesLaunched}>
            <p>Dés lancés: </p>
            <div className={styles.dices}>
              {(lobby?.step === step.dices || lobby?.step === step.lockAnimation) &&
                activePlayer?.dices?.map((data, index) => {
                  return (
                    <button
                      // TODO mettre un truc pour que ça soit pas cliquable si le joueur n'est pas celui qui joue
                      className={`${styles.dice} ${
                        selectedDices.includes(index) ? styles.diceSelected : ''
                      }`}
                      onClick={() => selectDice(index)}
                      key={`${data}-${index}`}
                    >
                      {data}
                      <DiceLockAnimation
                        show={selectedDices.includes(index) && lobby?.step === step.lockAnimation}
                      />
                    </button>
                  );
                })}
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
        {lobby?.step === step.none && user?.username === activePlayer?.username && (
          <button
            className={styles.rollButton}
            /**disabled={player._id !== state.user.id}*/
            onClick={() => {
              if (id) changeGameStep(id, step.dices);
            }}
          >
            Roll the dices 🎲
          </button>
        )}
        {lobby?.step === step.dices && user?.username === activePlayer?.username && (
          <button
            className={styles.lockButton}
            /**disabled={player._id !== state.user.id}*/ onClick={lockSelectedDices}
          >
            Lock the dices 🔒
          </button>
        )}
      </div>
      <div>
        {/* TODO mettre les mecs morts à la fin (le faire dans le back ?) et avec une class différente (genre en bas ? je me comprends pas)*/}
        {lobby?.players?.map((player, index) => {
          if (player.index === activePlayer?.index) return;
          return (
            <div className={styles.player} key={`${player.username}-${index}`}>
              <p>🙍‍♂️</p>
              <p>{player.username}</p>
              <p>
                {player.hp} <span className={styles.heart}>❤</span>
              </p>
            </div>
          );
        })}
      </div>
      {lobby?.step === step.scoreAdditionAnimation && (
        <DicesResultsAnimation
          dices={activePlayer?.lockedDices?.length === 6 ? activePlayer?.lockedDices : []}
          onAnimationEnd={() => {
            if (id) changeGameStep(id, step.none);
          }}
        />
      )}
    </div>
  );
};

export default Board;
