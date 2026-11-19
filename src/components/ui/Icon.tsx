import { SVGProps } from 'react';

// One small inline-SVG icon set (no icon library): 24×24, round 2.5px strokes,
// coloured by `currentColor`. Decorative by default (aria-hidden): the text
// next to an icon, or the button's label, carries the meaning.
const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h5v-6h3v6h5V10',
  menu: 'M5 12h.01M12 12h.01M19 12h.01',
  chat: 'M4 5.5h16v10.5H9.5L5 20v-4H4z',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M4.5 12.5l4.5 4.5L19.5 6.5',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  share: 'M12 15V3.5M7.5 8 12 3.5 16.5 8M5 12.5V20h14v-7.5',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18.5 14.5c1.8.7 2.8 2.6 3 5.5',
  crown: 'M3.5 18.5h17M4.5 15.5 3 7l5 4 4-6.5 4 6.5 5-4-1.5 8.5z',
  lock: 'M6 11h12v9.5H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  dice: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
  heart: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z',
  skull: 'M12 3a7.5 7.5 0 0 0-4.5 13.5V20h9v-3.5A7.5 7.5 0 0 0 12 3zM9 11.5h.01M15 11.5h.01M10.5 20v-2.5M13.5 20v-2.5',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01',
  refresh: 'M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4',
  wifiOff: 'M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.7M19 13a10 10 0 0 0-2.4-1.7M2 9.5a15 15 0 0 1 4.5-2.8M22 9.5A15 15 0 0 0 11 5.6M12 20h.01',
  vibrate: 'M8 4h8v16H8zM4 8v8M20 8v8M1.5 10v4M22.5 10v4',
  send: 'M4 12 20 4l-4 16-4-6.5zM12 13.5 20 4',
  arrowRight: 'M4 12h16M14 6l6 6-6 6',
  logout: 'M10 4H5v16h5M14.5 8l4 4-4 4M18.5 12H9',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  chevronDown: 'M6 9l6 6 6-6',
  link: 'M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4L11.5 6M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.5-1.4',
  eye: 'M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8.5 20.5h7M10 17h4v3.5h-4z',
  alert: 'M12 3.5 2.5 20h19zM12 10v4.5M12 17.5h.01',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 12h.01',
  hand: 'M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 10V4.5a1.5 1.5 0 0 1 3 0V11M15 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.6-2.2L3.5 15.5a1.6 1.6 0 0 1 2.4-2.1L9 16V7.5a1.5 1.5 0 0 0-3 0',
  sword: 'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  // Give a name to read when the icon is the only content (rare: prefer a visible label).
  label?: string;
}

const Icon = ({ name, size = 20, label, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    {...props}
  >
    <path d={PATHS[name]} />
  </svg>
);

export default Icon;
