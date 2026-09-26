import { useState } from 'react';

// Functions
import { STAKE_TARGET_LABELS } from '@/functions/functions';

// Style
import styles from './Lobby.module.css';

// Types
import { Game, Stake, StakeTarget } from '@/types/gameType';

// What the host changed: the other options keep their current value.
export interface OptionsChange {
  maxHp?: number;
  maxPlayers?: number;
  stake?: Stake;
}

interface RulesCardProps {
  lobby: Game;
  // Only the host can change the rules; everybody else sees them.
  isHost: boolean;
  error: string | null;
  onChange: (options: OptionsChange) => void;
}

const RulesCard: React.FC<RulesCardProps> = ({ lobby, isHost, error, onChange }) => {
  // Stake text typed by the host: only sent to the server when the field
  // loses focus (or on Enter), not on every keystroke. null: not edited yet.
  const [stakeDraft, setStakeDraft] = useState<string | null>(null);

  const stakeTarget: StakeTarget = lobby.stake?.target ?? 'firstLoser';
  const stakeText = stakeDraft ?? lobby.stake?.text ?? '';

  const saveStakeText = () => {
    if (stakeDraft !== null && stakeDraft.trim() !== (lobby.stake?.text ?? '')) {
      onChange({ stake: { target: stakeTarget, text: stakeDraft } });
    }
  };

  return (
    <section className={styles.card}>
      <h3 className={styles.subtitle}>Règles</h3>
      {!isHost && <p className={styles.hint}>Seul l&apos;host peut les modifier.</p>}
      <div className={styles.rules}>
        <label className={styles.rule} htmlFor="maxHp">
          Points de vie de départ
          <input
            className={styles.input}
            disabled={!isHost}
            value={lobby.maxHp}
            type="number"
            min={1}
            id="maxHp"
            onChange={(e) => onChange({ maxHp: Number(e.target.value) })}
          />
        </label>
        <label className={styles.rule} htmlFor="maxPlayers">
          Joueurs maximum
          <input
            className={styles.input}
            disabled={!isHost}
            value={lobby.maxPlayers}
            type="number"
            min={2}
            id="maxPlayers"
            onChange={(e) => onChange({ maxPlayers: Number(e.target.value) })}
          />
        </label>
      </div>
      <div className={styles.rule}>
        <label htmlFor="stakeTarget">Enjeu (facultatif)</label>
        <div className={styles.stakeRow}>
          <select
            id="stakeTarget"
            className={`${styles.input} ${styles.stakeTarget}`}
            disabled={!isHost}
            value={stakeTarget}
            onChange={(e) =>
              onChange({ stake: { target: e.target.value as StakeTarget, text: stakeText } })
            }
          >
            {Object.entries(STAKE_TARGET_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className={styles.stakeVerb}>devra :</span>
          <input
            className={`${styles.input} ${styles.stakeText}`}
            aria-label="Ce qu'il faudra faire"
            disabled={!isHost}
            maxLength={100}
            placeholder={isHost ? 'payer sa tournée 🍻' : "pas d'enjeu"}
            value={stakeText}
            onChange={(e) => setStakeDraft(e.target.value)}
            onBlur={saveStakeText}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
};

export default RulesCard;
