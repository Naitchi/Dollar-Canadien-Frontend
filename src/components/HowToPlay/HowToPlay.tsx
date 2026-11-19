import DieFace from '../ui/DieFace';
import styles from './HowToPlay.module.css';

interface HowToPlayProps {
  // Starting HP of the game being shown (30 by default).
  maxHp?: number;
  // 'cards' on the home page, 'compact' in the lobby and in the game menu.
  variant?: 'cards' | 'compact';
  headingLevel?: 'h2' | 'h3';
}

// The rules, written once (they were wrong on the old home page). They follow
// the server: backend/functions/turn.js and attack.js.
const HowToPlay = ({ maxHp = 30, variant = 'cards', headingLevel = 'h3' }: HowToPlayProps) => {
  const Heading = headingLevel;
  const steps = [
    {
      title: 'Lance tes 6 dés',
      dice: [3, 6, 1],
      text: (
        <>
          À ton tour, lance les dés et <strong>garde-en au moins 1</strong> à chaque lancer. Relance
          les autres jusqu&apos;à avoir gardé tes 6 dés.
        </>
      ),
    },
    {
      title: 'Vise 30',
      dice: [5, 4, 2],
      text: (
        <>
          On additionne tes 6 dés. <strong>Sous 30</strong>, tu perds la différence en PV (25 donne
          −5 PV). <strong>Pile 30</strong> : rien ne se passe.
        </>
      ),
    },
    {
      title: 'Au-dessus de 30 : attaque !',
      dice: [6, 6, 4],
      text: (
        <>
          La différence devient ton <strong>chiffre d&apos;attaque</strong> (34 donne 4). On relance les
          dés : chaque 4 fait 4 dégâts, tant qu&apos;il en tombe. La cible est{' '}
          <strong>désignée automatiquement</strong>.
        </>
      ),
    },
    {
      title: 'Le dernier debout gagne',
      dice: [1],
      text: (
        <>
          Tout le monde commence avec <strong>{maxHp} PV</strong>. À 0, t&apos;es K.O. Le dernier en
          vie gagne… et le gage tombe sur qui tu sais.
        </>
      ),
    },
  ];

  return (
    <ol role="list" className={variant === 'cards' ? styles.cards : styles.compact}>
      {steps.map((step, index) => (
        <li key={step.title} className={`${styles.step} ${variant === 'cards' ? styles.card : ''}`}>
          <span className={styles.number} aria-hidden="true">
            {index + 1}
          </span>
          <div className={styles.content}>
            <Heading className={styles.title}>{step.title}</Heading>
            <p className={styles.text}>{step.text}</p>
          </div>
          {variant === 'cards' && (
            <div className={styles.dice} aria-hidden="true">
              {step.dice.map((value, i) => (
                <DieFace key={i} value={value} size={34} />
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
};

export default HowToPlay;
