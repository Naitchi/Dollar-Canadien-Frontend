import { useId } from 'react';

import styles from './SegmentedControl.module.css';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: Option<T>[];
  // null: none of the options (e.g. a custom value elsewhere).
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
  hideLabel?: boolean;
}

// A radio group drawn as pills (HP presets, stake target). Native radios:
// arrow keys, labels and screen readers work out of the box.
function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className={styles.group} disabled={disabled}>
      <legend className={hideLabel ? 'sr-only' : styles.legend}>{label}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={styles.input}
            />
            <span className={styles.pill}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default SegmentedControl;
