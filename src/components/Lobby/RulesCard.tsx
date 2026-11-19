import { KeyboardEvent, useEffect, useId, useState } from 'react';

// Functions
import { STAKE_TARGET_LABELS } from '@/functions/functions';

// Components
import SegmentedControl from '../ui/SegmentedControl';
import Icon from '../ui/Icon';
import surface from '../ui/Surface.module.css';

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

// Same limits as the backend (functions/lobby.js).
const MAX_HP_LIMIT = 999;
const MAX_PLAYERS_LIMIT = 99;
const MAX_STAKE_LENGTH = 100;
const HP_PRESETS = ['15', '30', '50'] as const;
type HpChoice = (typeof HP_PRESETS)[number] | 'custom';

const blurOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === 'Enter') event.currentTarget.blur();
};

const RulesCard: React.FC<RulesCardProps> = ({ lobby, isHost, error, onChange }) => {
  const titleId = useId();
  const hpId = useId();
  const playersId = useId();
  const stakeId = useId();

  // Drafts: only sent to the server when the field loses focus (or on
  // Enter), never on every keystroke. null: not edited.
  const [stakeDraft, setStakeDraft] = useState<string | null>(null);
  const [hpDraft, setHpDraft] = useState<string | null>(null);
  const [playersDraft, setPlayersDraft] = useState<string | null>(null);
  const [customHp, setCustomHp] = useState(() => !HP_PRESETS.includes(String(lobby.maxHp) as never));

  useEffect(() => {
    if (!HP_PRESETS.includes(String(lobby.maxHp) as never)) setCustomHp(true);
  }, [lobby.maxHp]);

  const stakeTarget: StakeTarget = lobby.stake?.target ?? 'firstLoser';
  const stakeText = stakeDraft ?? lobby.stake?.text ?? '';
  const hpChoice: HpChoice | null = customHp
    ? 'custom'
    : HP_PRESETS.includes(String(lobby.maxHp) as never)
      ? (String(lobby.maxHp) as HpChoice)
      : null;

  const saveStakeText = () => {
    if (stakeDraft !== null && stakeDraft.trim() !== (lobby.stake?.text ?? '')) {
      onChange({ stake: { target: stakeTarget, text: stakeDraft } });
    }
    setStakeDraft(null);
  };

  const saveHp = () => {
    if (hpDraft === null) return;
    const value = Number(hpDraft);
    if (Number.isInteger(value) && value >= 1 && value <= MAX_HP_LIMIT && value !== lobby.maxHp) {
      onChange({ maxHp: value });
    }
    setHpDraft(null);
  };

  const savePlayers = () => {
    if (playersDraft === null) return;
    const value = Number(playersDraft);
    if (Number.isInteger(value) && value >= 2 && value <= MAX_PLAYERS_LIMIT && value !== lobby.maxPlayers) {
      onChange({ maxPlayers: value });
    }
    setPlayersDraft(null);
  };

  const hpInvalid = hpDraft !== null && !(Number.isInteger(Number(hpDraft)) && Number(hpDraft) >= 1 && Number(hpDraft) <= MAX_HP_LIMIT);

  return (
    <section className={`${surface.paper} ${styles.section}`} aria-labelledby={titleId}>
      <h2 id={titleId} className={surface.sectionTitle}>
        <span className={surface.dot} style={{ background: 'var(--c-yellow)' }} aria-hidden="true" />
        Règles de la partie
      </h2>

      {!isHost ? (
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>Points de vie</dt>
            <dd>{lobby.maxHp} PV au départ</dd>
          </div>
          <div className={styles.fact}>
            <dt>Gage</dt>
            <dd>
              {lobby.stake?.text ? (
                <>
                  {STAKE_TARGET_LABELS[stakeTarget]} devra : <strong>{lobby.stake.text}</strong>
                </>
              ) : (
                "Pas de gage (l'hôte peut en ajouter un)"
              )}
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>Joueurs</dt>
            <dd>{lobby.maxPlayers} maximum</dd>
          </div>
        </dl>
      ) : (
        <div className={styles.rules}>
          <div className={styles.rule}>
            <SegmentedControl<HpChoice>
              label="Points de vie au départ"
              value={hpChoice}
              options={[
                { value: '15', label: '15 · courte' },
                { value: '30', label: '30 · normale' },
                { value: '50', label: '50 · longue' },
                { value: 'custom', label: 'Autre' },
              ]}
              onChange={(choice) => {
                if (choice === 'custom') {
                  setCustomHp(true);
                  setTimeout(() => document.getElementById(hpId)?.focus(), 0);
                  return;
                }
                setCustomHp(false);
                setHpDraft(null);
                if (Number(choice) !== lobby.maxHp) onChange({ maxHp: Number(choice) });
              }}
            />
            {customHp && (
              <div className={styles.inlineField}>
                <label htmlFor={hpId} className={surface.fieldLabel}>
                  PV de départ (1 à {MAX_HP_LIMIT})
                </label>
                <input
                  id={hpId}
                  className={`${surface.input} ${styles.numberInput}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_HP_LIMIT}
                  value={hpDraft ?? lobby.maxHp}
                  aria-invalid={hpInvalid}
                  onChange={(event) => setHpDraft(event.target.value)}
                  onBlur={saveHp}
                  onKeyDown={blurOnEnter}
                />
              </div>
            )}
          </div>

          <div className={styles.rule}>
            <SegmentedControl<StakeTarget>
              label="Gage (facultatif) : qui devra le faire ?"
              value={stakeTarget}
              options={Object.entries(STAKE_TARGET_LABELS).map(([value, label]) => ({
                value: value as StakeTarget,
                label,
              }))}
              onChange={(target) => onChange({ stake: { target, text: stakeText } })}
            />
            <div className={styles.inlineField}>
              <label htmlFor={stakeId} className={surface.fieldLabel}>
                … devra :
              </label>
              <input
                id={stakeId}
                className={surface.input}
                maxLength={MAX_STAKE_LENGTH}
                placeholder="payer sa tournée 🍻"
                value={stakeText}
                onChange={(event) => setStakeDraft(event.target.value)}
                onBlur={saveStakeText}
                onKeyDown={blurOnEnter}
              />
            </div>
          </div>

          <details className={styles.more}>
            <summary>
              <Icon name="chevronDown" size={18} className={styles.chevron} /> Plus d&apos;options
            </summary>
            <div className={styles.inlineField}>
              <label htmlFor={playersId} className={surface.fieldLabel}>
                Joueurs maximum (2 à {MAX_PLAYERS_LIMIT})
              </label>
              <input
                id={playersId}
                className={`${surface.input} ${styles.numberInput}`}
                type="number"
                inputMode="numeric"
                min={2}
                max={MAX_PLAYERS_LIMIT}
                value={playersDraft ?? lobby.maxPlayers}
                onChange={(event) => setPlayersDraft(event.target.value)}
                onBlur={savePlayers}
                onKeyDown={blurOnEnter}
              />
            </div>
          </details>
        </div>
      )}
      {error && (
        <p className={surface.error} role="alert">
          <Icon name="alert" size={18} /> {error}
        </p>
      )}
    </section>
  );
};

export default RulesCard;
