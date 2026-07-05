import { useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

const btnCls =
  'h-[42px] px-4 bg-brown text-ink border-0 rounded-[10px] font-sans text-[.85rem] font-bold cursor-pointer hover:bg-brown-mid transition-colors whitespace-nowrap flex-shrink-0';

const inputCls =
  'border-[1.5px] border-border rounded-[10px] px-3 py-2 text-[.9rem] font-sans ' +
  'bg-cream text-ink outline-none h-[42px] transition-colors focus:border-brown w-full';

const sectionCls = 'bg-card rounded-2xl border border-border p-5 flex flex-col gap-3';
const titleCls   = 'font-bold text-[.92rem] text-ink mb-1';
const labelCls   = 'block text-[.7rem] font-bold text-ink-2 mb-1.5 uppercase tracking-[.05em]';

const dangerCls =
  'border-0 bg-transparent cursor-pointer text-ink-2 text-[.9rem] px-[7px] py-[3px] rounded-md transition-all hover:text-red hover:bg-red-pale';

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function CoinquiliniScreen({ house, onAddUser, onRemoveUser, onClose }) {
  useBodyScrollLock();
  const [copied, setCopied] = useState(false);
  const [uName, setUName] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(house.houseInviteCode ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function addUser() {
    if (!uName.trim()) return;
    setAddingUser(true);
    try {
      await onAddUser(uName.trim());
      setUName('');
    } finally {
      setAddingUser(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-brown z-[300] overflow-y-auto p-4">
      <div className="max-w-[480px] mx-auto flex flex-col gap-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[1.6rem] text-ink truncate">👥 Coinquilini</h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full border-0 cursor-pointer flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'rgba(78,34,15,.1)', color: '#7A5038' }}
          >
            <CloseIcon />
          </button>
        </div>

        {house.houseInviteCode && (
          <section className={sectionCls}>
            <div className={titleCls}>🔑 Fai entrare qualcuno da solo</div>
            <p className="text-[.77rem] text-ink-2 -mt-1">
              Condividi questo codice: potrà registrarsi scegliendo il proprio nome e PIN.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 text-center text-[1.3rem] font-mono font-bold tracking-[.15em] bg-cream-2 border border-border rounded-[10px] py-2 text-brown">
                {house.houseInviteCode}
              </code>
              <button onClick={copyCode} className={btnCls}>
                {copied ? '✅ Copiato' : 'Copia'}
              </button>
            </div>
          </section>
        )}

        <section className={sectionCls}>
          <div className={titleCls}>Oppure crea uno slot col suo nome</div>
          <p className="text-[.77rem] text-ink-2 -mt-1">
            Utile se vuoi che il turno sia già intestato a lei/lui: le darai il codice personale (mostrato nella lista qui sotto) per scegliere il PIN al primo accesso.
          </p>
          <div className="flex gap-2">
            <input
              value={uName} onChange={e => setUName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addUser()}
              placeholder="Nome coinquilino" className={inputCls}
            />
            <button onClick={addUser} disabled={addingUser || !uName.trim()} className={btnCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}>
              {addingUser ? '…' : 'Aggiungi'}
            </button>
          </div>
        </section>

        <section className={sectionCls}>
          <div className={titleCls}>In questa casa</div>
          <div className="flex flex-col gap-1.5">
            {house.users.map(u => (
              <div key={u.id} className="flex flex-col gap-1.5 px-3 py-[10px] bg-cream rounded-[10px] border border-border text-[.87rem]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <strong>{u.name}</strong>
                    {u.isAdmin && <span className="text-[.62rem] font-bold bg-brown text-ink px-[7px] py-[2px] rounded-full">admin</span>}
                    {!u.claimed && <span className="text-[.62rem] font-bold bg-cream-2 text-ink-2 px-[7px] py-[2px] rounded-full">non attivato</span>}
                  </span>
                  {!u.isAdmin && (
                    <button onClick={() => onRemoveUser(u.id)} className={dangerCls}>✕</button>
                  )}
                </div>
                {u.inviteCode && (
                  <div className="flex items-center gap-2">
                    <span className="text-[.7rem] text-ink-2">Codice personale:</span>
                    <code className="text-[.72rem] bg-cream-2 px-2 py-0.5 rounded text-brown font-mono font-bold tracking-[.05em]">{u.inviteCode}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
