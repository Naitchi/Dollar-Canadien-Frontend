import { RootState } from '@/store/store';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

// Styles
import styles from './Results.module.css';

// Types
import { Game, Player } from '@/types/gameType';

const Results = () => {
  const lobby = useSelector((state: RootState) => state.game.game);

  const [winner, setWinner] = useState<Player | null>(null);

  useEffect(() => {
    if (!lobby) return;
    const getWinner = (game: Game) => {
      const activeId = game.actif;
      setWinner(game.players.filter((player) => player._id == activeId)[0]);
    };
    getWinner(lobby);
  }, [lobby]);

  // TODO pour l'instant si un mec meurt de lui meme et quil reste un joueur alore l'autre devra jouer avant de gagner :(

  return (
    <div className={styles.Results}>
      <h2 className={styles.title}>{winner?.username} a gagne !</h2>
      <p>OUAIS GG YIPEE</p>
    </div>
  );
};

export default Results;
