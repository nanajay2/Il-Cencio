import { useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

const btnCls =
  'h-[42px] px-4 bg-brown text-ink border-0 rounded-[10px] font-sans text-[.85rem] font-bold cursor-pointer hover:bg-brown-mid transition-colors whitespace-nowrap flex-shrink-0';

const inputCls =
  'border-[1.5px] border-border rounded-[10px] px-3 py-2 text-[.9rem] font-sans ' +
  'bg-cream text-ink outline-none h-[42px] transition-colors focus:border-brown';

const sectionCls = 'bg-card rounded-2xl border border-border p-5 flex flex-col gap-3';
const titleCls   = 'font-bold text-[.92rem] text-ink mb-1';

const ROTATIONS = [
  { value: 'weekly',  icon: '📅', label: 'Settimanale',            hint: 'I turni cambiano ogni 7 giorni, il modo più classico.' },
  { value: 'daily',   icon: '🔢', label: 'Giornaliera personalizzata', hint: 'Scegli tu ogni quanti giorni ruotano (1-30).' },
  { value: 'monthly', icon: '🗓️', label: 'Mensile',                hint: 'I turni cambiano all\'inizio di ogni mese di calendario.' },
];

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function RotationScreen({ house, onUpdateRotation, onClose }) {
  useBodyScrollLock();
  const [rotationType, setRotationType] = useState(house.rotationType ?? 'weekly');
  const [rotationDays, setRotationDays] = useState(house.rotationDays ?? 3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await onUpdateRotation(rotationType, rotationType === 'daily' ? rotationDays : null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-brown z-[300] overflow-y-auto p-4">
      <div className="max-w-[480px] mx-auto flex flex-col gap-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[1.6rem] text-ink truncate">🔄 Rotazione turni</h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full border-0 cursor-pointer flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'rgba(78,34,15,.1)', color: '#7A5038' }}
          >
            <CloseIcon />
          </button>
        </div>

        <section className={sectionCls}>
          <p className="text-[.8rem] text-ink-2 -mt-1">
            Cambiare la rotazione rigenera i turni da oggi in poi; quelli passati restano invariati.
          </p>

          <div className="flex flex-col gap-2">
            {ROTATIONS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRotationType(r.value)}
                className={
                  'text-left px-4 py-3 rounded-[12px] border-[1.5px] transition-colors cursor-pointer flex items-start gap-3 ' +
                  (rotationType === r.value ? 'bg-brown border-brown' : 'bg-cream border-border hover:bg-cream-2')
                }
              >
                <span className="text-[1.3rem] leading-none mt-0.5">{r.icon}</span>
                <span>
                  <div className="font-bold text-[.9rem] text-ink">{r.label}</div>
                  <div className="text-[.78rem] text-ink-2 mt-0.5">{r.hint}</div>
                </span>
              </button>
            ))}
          </div>

          {rotationType === 'daily' && (
            <div>
              <label className="block text-[.7rem] font-bold text-ink-2 mb-1.5 uppercase tracking-[.05em]">Ogni quanti giorni</label>
              <input
                type="number" min={1} max={30}
                value={rotationDays}
                onChange={e => setRotationDays(Number(e.target.value))}
                className={inputCls}
                style={{ maxWidth: '120px' }}
              />
            </div>
          )}

          <button onClick={save} disabled={saving} className={btnCls + ' self-start'}>
            {saving ? 'Salvataggio…' : saved ? '✅ Salvato' : 'Salva'}
          </button>
        </section>

      </div>
    </div>
  );
}
