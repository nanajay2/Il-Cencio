import { useState } from 'react';

const inputCls =
  'border-[1.5px] border-border rounded-[10px] px-3 py-2 text-[.84rem] font-sans ' +
  'bg-cream text-ink outline-none h-[38px] transition-colors focus:border-brown flex-1 min-w-0';

const btnCls =
  'h-[38px] px-4 bg-brown text-ink border-0 rounded-[10px] font-sans text-[.8rem] font-bold cursor-pointer hover:bg-brown-mid transition-colors whitespace-nowrap flex-shrink-0';

const dangerCls =
  'border-0 bg-transparent cursor-pointer text-ink-2 text-[.9rem] px-[7px] py-[3px] rounded-md transition-all hover:text-red hover:bg-red-pale';

const sectionCls = 'bg-card rounded-2xl border border-border p-5 flex flex-col gap-3';
const titleCls   = 'font-bold text-[.92rem] text-ink mb-1';

const selectCls = inputCls + ' appearance-none';

const ROTATIONS = [
  { value: 'weekly',  label: 'Settimanale' },
  { value: 'daily',   label: 'Giornaliera personalizzata' },
  { value: 'monthly', label: 'Mensile' },
];

const RULE_TYPES = [
  { value: 'pool_restriction', icon: '🚿', label: '🚿 Restrizione pool (es. Bagno)', hint: 'Solo le persone selezionate possono fare questa stanza.' },
  { value: 'sequence',         icon: '🔄', label: '🔄 Sequenza (es. Cucina→Corridoio)', hint: 'Chi fa la prima stanza, la settimana dopo fa automaticamente la seconda.' },
  { value: 'exclusion',        icon: '🚫', label: '🚫 Esclusione', hint: 'La persona selezionata non farà mai questa stanza.' },
];

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function describeRule(rule, rooms, users) {
  const roomName = id => rooms.find(r => r.id === id)?.name ?? `Stanza #${id}`;
  const userName = id => users.find(u => u.id === id)?.name ?? `Utente #${id}`;
  const { type, config } = rule;
  if (type === 'pool_restriction') {
    return `${roomName(config.room_id)} → solo ${(config.user_ids ?? []).map(userName).join(', ') || '—'}`;
  }
  if (type === 'sequence') {
    return `${roomName(config.from_room_id)} → ${roomName(config.to_room_id)} la settimana dopo`;
  }
  if (type === 'exclusion') {
    return `${userName(config.user_id)} mai su ${roomName(config.room_id)}`;
  }
  return JSON.stringify(config);
}

export function SettingsPanel({
  house, isAdmin,
  onClose, onLogout, onLeaveHouse,
  onRemoveUser, onAddRoom, onRemoveRoom, onAddRule, onRemoveRule,
  onUpdateRotation,
}) {
  const [copied, setCopied] = useState(false);
  // Rooms state
  const [rName,  setRName]  = useState('');
  const [rIcon,  setRIcon]  = useState('🏠');
  const [rColor, setRColor] = useState('#BDB395');

  // Rotation state
  const [rotationType, setRotationType] = useState(house.rotationType ?? 'weekly');
  const [rotationDays, setRotationDays] = useState(house.rotationDays ?? 3);
  const [savingRotation, setSavingRotation] = useState(false);

  // Rules state
  const [ruleType,   setRuleType]   = useState(RULE_TYPES[0].value);
  const [poolRoom,   setPoolRoom]   = useState('');
  const [poolUsers,  setPoolUsers]  = useState([]);
  const [seqFrom,    setSeqFrom]    = useState('');
  const [seqTo,      setSeqTo]      = useState('');
  const [exclUser,   setExclUser]   = useState('');
  const [exclRoom,   setExclRoom]   = useState('');

  function copyCode() {
    navigator.clipboard.writeText(house.houseInviteCode ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function addRoom() {
    if (!rName.trim()) return;
    await onAddRoom({ name: rName.trim(), icon: rIcon, color: rColor, sortOrder: house.rooms.length });
    setRName('');
  }

  function toggleAllowedUser(id) {
    setPoolUsers(ids => ids.includes(id) ? ids.filter(u => u !== id) : [...ids, id]);
  }

  async function saveRotation() {
    setSavingRotation(true);
    try {
      await onUpdateRotation(rotationType, rotationType === 'daily' ? rotationDays : null);
    } finally {
      setSavingRotation(false);
    }
  }

  async function addRule() {
    if (ruleType === 'pool_restriction') {
      if (!poolRoom || poolUsers.length === 0) return;
      await onAddRule('pool_restriction', { room_id: Number(poolRoom), user_ids: poolUsers.map(Number) });
      setPoolRoom(''); setPoolUsers([]);
    } else if (ruleType === 'sequence') {
      if (!seqFrom || !seqTo || seqFrom === seqTo) return;
      await onAddRule('sequence', { from_room_id: Number(seqFrom), to_room_id: Number(seqTo) });
      setSeqFrom(''); setSeqTo('');
    } else if (ruleType === 'exclusion') {
      if (!exclUser || !exclRoom) return;
      await onAddRule('exclusion', { user_id: Number(exclUser), room_id: Number(exclRoom) });
      setExclUser(''); setExclRoom('');
    }
  }

  const showRulesSection = isAdmin || house.rules.length > 0;

  return (
    <div className="fixed inset-0 bg-brown z-[300] overflow-y-auto p-4">
      <div className="max-w-[480px] mx-auto flex flex-col gap-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[1.6rem] text-ink truncate">⚙️ Impostazioni</h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full border-0 cursor-pointer flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'rgba(78,34,15,.1)', color: '#7A5038' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(78,34,15,.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(78,34,15,.1)'; }}
          >
            <CloseIcon />
          </button>
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

        {/* Rotazione turni — solo admin */}
        {isAdmin && (
          <section className={sectionCls}>
            <div className={titleCls}>🔄 Rotazione turni</div>
            <p className="text-[.77rem] text-ink-2 -mt-1">
              Cambiare la rotazione rigenera i turni da oggi in poi; quelli passati restano invariati.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {ROTATIONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRotationType(r.value)}
                  className={
                    'px-3 py-1.5 rounded-full text-[.78rem] font-semibold border-[1.5px] transition-colors cursor-pointer ' +
                    (rotationType === r.value
                      ? 'bg-brown text-ink border-brown'
                      : 'bg-cream text-ink-2 border-border')
                  }
                >
                  {r.label}
                </button>
              ))}
            </div>

            {rotationType === 'daily' && (
              <input
                type="number" min={1} max={30}
                value={rotationDays}
                onChange={e => setRotationDays(Number(e.target.value))}
                className={inputCls}
                style={{ maxWidth: '120px' }}
              />
            )}

            <button onClick={saveRotation} disabled={savingRotation} className={btnCls + ' self-start'}>
              {savingRotation ? 'Salvataggio…' : 'Salva'}
            </button>
          </section>
        )}

        {/* Coinquilini */}
        <section className={sectionCls}>
          <div className={titleCls}>👥 Coinquilini</div>

          {isAdmin ? (
            <div className="flex flex-col gap-1.5 mt-1">
              {house.users.map(u => (
                <div key={u.id} className="flex items-center justify-between px-3 py-[9px] bg-cream rounded-[10px] border border-border text-[.83rem]">
                  <span>
                    <strong>{u.name}</strong>
                    <span className="text-ink-2 ml-1.5">{u.email}</span>
                    {u.isAdmin && <span className="ml-1.5 text-[.62rem] font-bold bg-brown text-ink px-[7px] py-[2px] rounded-full">admin</span>}
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
          ) : (
            <div className="flex flex-col gap-1.5 mt-1">
              {house.users.map(u => (
                <div key={u.id} className="px-3 py-[9px] bg-cream rounded-[10px] border border-border text-[.83rem]">
                  {u.name}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Stanze — admin: gestibili; utente normale: sola lettura */}
        <section className={sectionCls}>
          <div className={titleCls}>🏠 Stanze</div>

          {isAdmin && (
            <div className="flex gap-2 flex-wrap">
              <input value={rName} onChange={e => setRName(e.target.value)} placeholder="Nome stanza" className={inputCls} style={{ minWidth: '120px' }} />
              <input value={rIcon} onChange={e => setRIcon(e.target.value)} placeholder="Emoji" className={`${inputCls} max-w-[60px] text-center`} maxLength={2} />
              <input type="color" value={rColor} onChange={e => setRColor(e.target.value)} className="h-[38px] w-[46px] border border-border rounded-[10px] cursor-pointer bg-cream p-1 flex-shrink-0" />
              <button onClick={addRoom} className={btnCls}>Aggiungi</button>
            </div>
          )}

          <div className="flex flex-col gap-1.5 mt-1">
            {house.rooms.map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-[9px] bg-cream rounded-[10px] border border-border text-[.83rem]">
                <span className="flex items-center gap-2">
                  <span className="text-[1.1rem]">{r.icon}</span>
                  <strong>{r.name}</strong>
                  <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: r.color }} />
                </span>
                {isAdmin && <button onClick={() => onRemoveRoom(r.id)} className={dangerCls}>✕</button>}
              </div>
            ))}
          </div>
        </section>

        {/* Regole — admin: sempre visibile (per poterle aggiungere); utente normale: solo se ce ne sono, in lettura */}
        {showRulesSection && (
          <section className={sectionCls}>
            <div className={titleCls}>📋 Regole</div>

            {isAdmin ? (
              <>
                <p className="text-[.77rem] text-ink-2 -mt-1">
                  Le regole controllano chi può fare cosa e in quale ordine.
                </p>

                <div className="flex flex-col gap-1.5 mt-1">
                  {house.rules.length === 0 ? (
                    <p className="text-[.82rem] text-ink-2">Nessuna regola configurata.</p>
                  ) : house.rules.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-3 py-[9px] bg-cream rounded-[10px] border border-border text-[.83rem]">
                      <span>
                        <span className="font-bold">{RULE_TYPES.find(t => t.value === r.type)?.icon ?? '📋'}</span>
                        <span className="ml-1.5">{describeRule(r, house.rooms, house.users)}</span>
                      </span>
                      <button onClick={() => onRemoveRule(r.id)} className={dangerCls}>✕</button>
                    </div>
                  ))}
                </div>

                {house.rooms.length === 0 || house.users.length === 0 ? (
                  <p className="text-[.8rem] text-ink-2 mt-1">Aggiungi prima stanze e coinquilini per poter creare regole.</p>
                ) : (
                  <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-border">
                    <select value={ruleType} onChange={e => setRuleType(e.target.value)} className={selectCls}>
                      {RULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <p className="text-[.75rem] text-ink-2 -mt-1">{RULE_TYPES.find(t => t.value === ruleType)?.hint}</p>

                    {ruleType === 'pool_restriction' && (
                      <>
                        <select value={poolRoom} onChange={e => setPoolRoom(e.target.value)} className={selectCls}>
                          <option value="">Scegli stanza…</option>
                          {house.rooms.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                        </select>
                        <div className="flex flex-wrap gap-1.5">
                          {house.users.map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => toggleAllowedUser(u.id)}
                              className={
                                'px-3 py-1.5 rounded-full text-[.78rem] font-semibold border-[1.5px] transition-colors cursor-pointer ' +
                                (poolUsers.includes(u.id)
                                  ? 'bg-brown text-ink border-brown'
                                  : 'bg-cream text-ink-2 border-border')
                              }
                            >
                              {u.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {ruleType === 'sequence' && (
                      <div className="flex items-center gap-2">
                        <select value={seqFrom} onChange={e => setSeqFrom(e.target.value)} className={selectCls}>
                          <option value="">Stanza di partenza…</option>
                          {house.rooms.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                        </select>
                        <span className="text-ink-2">→</span>
                        <select value={seqTo} onChange={e => setSeqTo(e.target.value)} className={selectCls}>
                          <option value="">Stanza successiva…</option>
                          {house.rooms.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                        </select>
                      </div>
                    )}

                    {ruleType === 'exclusion' && (
                      <div className="flex items-center gap-2">
                        <select value={exclUser} onChange={e => setExclUser(e.target.value)} className={selectCls}>
                          <option value="">Scegli persona…</option>
                          {house.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <span className="text-ink-2">∌</span>
                        <select value={exclRoom} onChange={e => setExclRoom(e.target.value)} className={selectCls}>
                          <option value="">Scegli stanza…</option>
                          {house.rooms.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                        </select>
                      </div>
                    )}

                    <button onClick={addRule} className={btnCls + ' self-start'}>+ Aggiungi regola</button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-1.5 mt-1">
                {house.rules.map(r => (
                  <div key={r.id} className="px-3 py-[9px] bg-cream rounded-[10px] border border-border text-[.83rem]">
                    <span className="font-bold">{RULE_TYPES.find(t => t.value === r.type)?.icon ?? '📋'}</span>
                    <span className="ml-1.5">{describeRule(r, house.rooms, house.users)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Logout / abbandona */}
        <div className="flex flex-col gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full py-3 rounded-2xl border-0 cursor-pointer font-bold text-[.88rem] transition-all"
              style={{ background: 'rgba(78,34,15,.08)', color: 'rgba(78,34,15,.6)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(78,34,15,.16)'; e.currentTarget.style.color = 'rgba(78,34,15,.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(78,34,15,.08)'; e.currentTarget.style.color = 'rgba(78,34,15,.6)'; }}
            >
              Esci
            </button>
          )}

          {onLeaveHouse && (
            <button
              onClick={onLeaveHouse}
              className="w-full py-3 rounded-2xl border-[1.5px] border-red cursor-pointer font-bold text-[.88rem] text-red bg-transparent hover:bg-red-pale transition-colors"
            >
              Abbandona la casa
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
