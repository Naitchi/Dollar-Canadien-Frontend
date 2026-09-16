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
      const winner: Player = game.players.filter((player) => player.hp > 0)[0];
      if (winner) setWinner(winner);
      else console.error('No winner found');
    };
    getWinner(lobby);
  }, [lobby]);

  return (
    <div className={styles.Results}>
      <h2 className={styles.title}>{winner?.username} a gagne !</h2>
      <p>OUAIS GG YIPEE</p>
    </div>
  );
};

export default Results;
