import { RootState } from '@/store/store';
import { useState } from 'react';
import { useSelector } from 'react-redux';

// Service
import { lockDices } from '@/services/services';

// Styles
import styles from './Board.module.css';

// Types
import { Player, step } from '@/types/gameType';

// Store
import { getUser } from '@/store/slices/clientSlice';
import { selectActivePlayer } from '@/store/slices/gameSlice';

// Components
import DiceLockAnimation from '../DiceLockAnimation/DiceLockAnimation';

interface State {
  step: step;
}

const Board = () => {
  const [selectedDices, setSelectedDices] = useState<number[]>([]);
  const [state, setState] = useState<State>({ step: step.none });

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
   * Updates the application state to transition to the dice display step.
   */
  const launchDices = (): void => {
    setState((state) => ({ ...state, step: step.dices }));
  };

  /**
   * Locks the selected dices for the current user by sending a request to the backend service.
   */
  const lockSelectedDices = (): void => {
    if (!id || !user || selectedDices.length === 0) return;
    // TODO faire pour tout pour etre sur que le back nous retourne pas une erreur (dans le sens ou l'animation doit etre une "validation" que ç'a bien marché normalement IKEK)
    // TODO genre la actuellement ça serai de check si c'est bien un tableau de chiffre et en fonction des chiffres qu'on nous donne que ça soit dedans

    setState((state) => ({ ...state, step: step.lockAnimation }));

    setTimeout(() => {
      lockDices(user, id, selectedDices);
      setSelectedDices([]);

      // TODO en gros on check peut-etre pas sur le bon si ça passe au joueur suivant on est baisé
      // TODO il faudrait s'assurer que les résultats du tour s'affichent bien avant de passé au joueur suivant en mode après l'animation un service pour changer le joueur actif/lui donner ses dés imo
      if (activePlayer?.lockedDices?.length === 6)
        setState((state) => ({
          ...state,
          step: step.scoreAdditionAnimation,
        }));
      else
        setState((state) => ({
          ...state,
          step: step.none,
        }));
    }, 1400);
  };

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
        {/** TODO remplacer ces buttons par des dés 3d avec Three.js et si possible avec une animation quand ils arrivent */}
        <div className={styles.dicesContainer}>
          <div className={styles.dicesLaunched}>
            <p>Dés lancés: </p>
            <div className={styles.dices}>
              {(state.step === step.dices || state.step === step.lockAnimation) &&
                activePlayer?.dices?.map((data, index) => {
                  return (
                    <button
                      className={`${styles.dice} ${
                        selectedDices.includes(index) ? styles.diceSelected : ''
                      }`}
                      onClick={() => selectDice(index)}
                      key={`${data}-${index}`}
                    >
                      {data}
                      <DiceLockAnimation
                        show={selectedDices.includes(index) && state.step === step.lockAnimation}
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
        {state.step === step.none && user?.username === activePlayer?.username && (
          <button
            className={styles.rollButton}
            /**disabled={player._id !== state.user.id}*/ onClick={launchDices}
          >
            Roll the dices 🎲
          </button>
        )}
        {state.step === step.dices && user?.username === activePlayer?.username && (
          <button
            className={styles.lockButton}
            /**disabled={player._id !== state.user.id}*/ onClick={lockSelectedDices}
          >
            Lock the dices 🔒
          </button>
        )}
      </div>
      <div>
        {/* TODO mettre les mecs morts à la fin (le faire dans le back ?) et avec une class différente */}
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
    </div>
  );
};

// TODO intergrer la nouvelle animation de lock de des

export default Board;
