import { readableOn } from '../lib/color.js';

export function Avatar({ name, color = '#1D6F5F', size = 36 }) {
  return (
    <span
      aria-hidden="true"
      className="rounded-full flex-shrink-0 flex items-center justify-center font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4, background: color, color: readableOn(color) }}
    >
      {(name ?? '?').charAt(0).toUpperCase()}
    </span>
  );
}
