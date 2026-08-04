const MODES = [
  { key: 'settimana', label: 'Settimana' },
  { key: 'mese',      label: 'Mese' },
];

export function ViewModeSwitcher({ mode, onChange }) {
  return (
    <div className="px-4 pt-2 flex gap-2">
      {MODES.map(m => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={
            'flex-1 py-2 rounded-full font-bold text-[.78rem] border cursor-pointer transition-colors ' +
            (mode === m.key
              ? 'bg-brown text-ink border-brown'
              : 'bg-card border-border text-ink-2 hover:bg-cream-2')
          }
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
