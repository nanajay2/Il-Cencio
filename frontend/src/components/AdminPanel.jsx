import { useState } from 'react';

const inputCls =
  'border-[1.5px] border-border rounded-[10px] px-3 py-2 text-[.84rem] font-sans ' +
  'bg-cream text-ink outline-none h-[38px] transition-colors focus:border-brown flex-1 min-w-0';

const btnCls =
  'h-[38px] px-4 bg-brown text-white border-0 rounded-[10px] font-sans text-[.8rem] font-bold cursor-pointer hover:bg-brown-mid transition-colors whitespace-nowrap flex-shrink-0';

const dangerCls =
  'border-0 bg-transparent cursor-pointer text-ink-2 text-[.9rem] px-[7px] py-[3px] rounded-md transition-all hover:text-red-500 hover:bg-red-50';

const sectionCls = 'bg-card rounded-2xl border border-border p-5 flex flex-col gap-3';
const titleCls   = 'font-bold text-[.92rem] text-ink mb-1';

export function AdminPanel({ house, onClose, onRemoveUser, onAddRoom, onRemoveRoom, onAddRule, onRemoveRule, onLogout }) {
  const [copied, setCopied] = useState(false);
  // Rooms state
  const [rName,  setRName]  = useState('');
  const [rIcon,  setRIcon]  = useState('🏠');
  const [rColor, setRColor] = useState('#c97b4b');

  function copyCode() {
    navigator.clipboard.writeText(house.houseInviteCode ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const RULE_TYPES = [
    { value: 'pool_restriction', label: '🚿 Restrizione pool (es. Bagno)' },
    { value: 'sequence',         label: '🔄 Sequenza (es. Cucina→Corridoio)' },
    { value: 'exclusion',        label: '🚫 Esclusione (persona sempre fuori da stanza)' },
  ];

  async function addRoom() {
    if (!rName.trim()) return;
    await onAddRoom({ name: rName.trim(), icon: rIcon, color: rColor, sortOrder: house.rooms.length });
    setRName('');
  }

  return (
    <div className="fixed inset-0 backdrop-blur-[10px] z-[300] overflow-y-auto p-4" style={{ background: 'rgba(78,34,15,.82)' }}>
      <div className="max-w-[480px] mx-auto flex flex-col gap-4 pb-8 pt-4">

        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[1.6rem] text-white">⚙️ Admin — {house.name}</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-[1.3rem] border-0 bg-transparent cursor-pointer transition-colors">✕</button>
        </div>

        {/* Codice invito casa */}
        {house.houseInviteCode && (
          <section className={sectionCls}>
            <div className={titleCls}>🔑 Codice invito casa</div>
            <p className="text-[.77rem] text-ink-2 -mt-1">Condividi questo codice con i nuovi coinquilini per farli registrare.</p>
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

        {/* Coinquilini */}
        <section className={sectionCls}>
          <div className={titleCls}>👥 Coinquilini</div>

          <div className="flex flex-col gap-1.5 mt-1">
            {house.users.map(u => (
              <div key={u.id} className="flex items-center justify-between px-3 py-[9px] bg-cream rounded-[10px] border border-border text-[.83rem]">
                <span>
                  <strong>{u.name}</strong>
                  <span className="text-ink-2 ml-1.5">{u.email}</span>
                  {u.isAdmin && <span className="ml-1.5 text-[.62rem] font-bold bg-brown text-white px-[7px] py-[2px] rounded-full">admin</span>}
                  {!u.claimed && <span className="ml-1.5 text-[.62rem] font-bold bg-cream-2 text-ink-2 px-[7px] py-[2px] rounded-full">non attivato</span>}
                </span>
                <div className="flex items-center gap-2">
                  {u.inviteCode && (
                    <code className="text-[.65rem] bg-cream-2 px-1.5 py-0.5 rounded text-brown font-mono">{u.inviteCode}</code>
                  )}
                  {!u.isAdmin && (
                    <button onClick={() => onRemoveUser(u.id)} className={dangerCls}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stanze */}
        <section className={sectionCls}>
          <div className={titleCls}>🏠 Stanze</div>

          <div className="flex gap-2 flex-wrap">
            <input value={rName} onChange={e => setRName(e.target.value)} placeholder="Nome stanza" className={inputCls} style={{ minWidth: '120px' }} />
            <input value={rIcon} onChange={e => setRIcon(e.target.value)} placeholder="Emoji" className={`${inputCls} max-w-[60px] text-center`} maxLength={2} />
            <input type="color" value={rColor} onChange={e => setRColor(e.target.value)} className="h-[38px] w-[46px] border border-border rounded-[10px] cursor-pointer bg-cream p-1 flex-shrink-0" />
            <button onClick={addRoom} className={btnCls}>Aggiungi</button>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            {house.rooms.map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-[9px] bg-cream rounded-[10px] border border-border text-[.83rem]">
                <span className="flex items-center gap-2">
                  <span className="text-[1.1rem]">{r.icon}</span>
                  <strong>{r.name}</strong>
                  <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: r.color }} />
                </span>
                <button onClick={() => onRemoveRoom(r.id)} className={dangerCls}>✕</button>
              </div>
            ))}
          </div>
        </section>

        {/* Regole */}
        <section className={sectionCls}>
          <div className={titleCls}>📋 Regole</div>
          <p className="text-[.77rem] text-ink-2 -mt-1">
            Le regole controllano chi può fare cosa e in quale ordine.<br />
            Per configurare regole avanzate, contatta il supporto o modifica direttamente su Supabase.
          </p>

          <div className="flex flex-col gap-1.5 mt-1">
            {house.rules.length === 0 ? (
              <p className="text-[.82rem] text-ink-2">Nessuna regola configurata.</p>
            ) : house.rules.map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-[9px] bg-cream rounded-[10px] border border-border text-[.83rem]">
                <span>
                  <span className="font-bold">{RULE_TYPES.find(t => t.value === r.type)?.label ?? r.type}</span>
                  <span className="text-ink-2 ml-2 text-[.75rem]">{JSON.stringify(r.config)}</span>
                </span>
                <button onClick={() => onRemoveRule(r.id)} className={dangerCls}>✕</button>
              </div>
            ))}
          </div>
        </section>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-2xl border-0 cursor-pointer font-bold text-[.88rem] transition-all"
            style={{ background: 'rgba(246,240,240,.08)', color: 'rgba(246,240,240,.6)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(246,240,240,.16)'; e.currentTarget.style.color = 'rgba(246,240,240,.9)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(246,240,240,.08)'; e.currentTarget.style.color = 'rgba(246,240,240,.6)'; }}
          >
            Esci dall'account
          </button>
        )}

      </div>
    </div>
  );
}
