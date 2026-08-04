import { useState } from 'react';
import { X, Pencil, Settings, Bell, ClipboardList, ShowerHead, Workflow, Ban, Coffee, Sparkles, ArrowRight } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';
import { usePush } from '../hooks/usePush.js';

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

const RULE_TYPES = [
  { value: 'pool_restriction', icon: ShowerHead, label: 'Restrizione pool (es. Bagno)', hint: 'Solo le persone selezionate possono fare questa stanza.' },
  { value: 'sequence',         icon: Workflow,   label: 'Sequenza (es. Cucina→Corridoio)', hint: 'Chi fa la prima stanza, la settimana dopo fa automaticamente la seconda.' },
  { value: 'exclusion',        icon: Ban,        label: 'Esclusione', hint: 'La persona selezionata non farà mai questa stanza.' },
];

function RuleTypeIcon({ type, ...props }) {
  const Icon = RULE_TYPES.find(t => t.value === type)?.icon ?? ClipboardList;
  return <Icon {...props} />;
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
  house, isAdmin, houseId, userId,
  onClose, onLogout, onLeaveHouse,
  onAddRule, onEditRule, onRemoveRule,
}) {
  useBodyScrollLock();
  const push = usePush();

  // Rules state
  const [ruleType,   setRuleType]   = useState(RULE_TYPES[0].value);
  const [poolRoom,   setPoolRoom]   = useState('');
  const [poolUsers,  setPoolUsers]  = useState([]);
  const [seqFrom,    setSeqFrom]    = useState('');
  const [seqTo,      setSeqTo]      = useState('');
  const [exclUser,   setExclUser]   = useState('');
  const [exclRoom,   setExclRoom]   = useState('');
  const [editingRuleId, setEditingRuleId] = useState(null);

  function toggleAllowedUser(id) {
    setPoolUsers(ids => ids.includes(id) ? ids.filter(u => u !== id) : [...ids, id]);
  }

  function resetRuleForm() {
    setEditingRuleId(null);
    setPoolRoom(''); setPoolUsers([]);
    setSeqFrom(''); setSeqTo('');
    setExclUser(''); setExclRoom('');
  }

  function startEditRule(rule) {
    setEditingRuleId(rule.id);
    setRuleType(rule.type);
    const { config } = rule;
    if (rule.type === 'pool_restriction') {
      setPoolRoom(config.room_id);
      setPoolUsers(config.user_ids ?? []);
    } else if (rule.type === 'sequence') {
      setSeqFrom(config.from_room_id);
      setSeqTo(config.to_room_id);
    } else if (rule.type === 'exclusion') {
      setExclUser(config.user_id);
      setExclRoom(config.room_id);
    }
  }

  async function addRule() {
    if (ruleType === 'pool_restriction') {
      if (!poolRoom || poolUsers.length === 0) return;
      const config = { room_id: Number(poolRoom), user_ids: poolUsers.map(Number) };
      if (editingRuleId) await onEditRule(editingRuleId, 'pool_restriction', config);
      else await onAddRule('pool_restriction', config);
      resetRuleForm();
    } else if (ruleType === 'sequence') {
      if (!seqFrom || !seqTo || seqFrom === seqTo) return;
      const config = { from_room_id: Number(seqFrom), to_room_id: Number(seqTo) };
      if (editingRuleId) await onEditRule(editingRuleId, 'sequence', config);
      else await onAddRule('sequence', config);
      resetRuleForm();
    } else if (ruleType === 'exclusion') {
      if (!exclUser || !exclRoom) return;
      const config = { user_id: Number(exclUser), room_id: Number(exclRoom) };
      if (editingRuleId) await onEditRule(editingRuleId, 'exclusion', config);
      else await onAddRule('exclusion', config);
      resetRuleForm();
    }
  }

  const showRulesSection = isAdmin || house.rules.length > 0;

  return (
    <div className="fixed inset-0 bg-brown z-[300] overflow-y-auto p-4">
      <div className="max-w-[480px] mx-auto flex flex-col gap-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[1.6rem] text-ink truncate flex items-center gap-2">
            <Settings size={22} className="flex-shrink-0" /> Impostazioni
          </h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full border-0 cursor-pointer flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'rgba(78,34,15,.1)', color: '#7A5038' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(78,34,15,.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(78,34,15,.1)'; }}
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>

        {/* Notifiche push */}
        <section className={sectionCls}>
          <div className={titleCls + ' flex items-center gap-1.5'}><Bell size={16} /> Notifiche push</div>
          {push.status === 'unsupported' && (
            <p className="text-[.77rem] text-ink-2 -mt-1">
              Non supportate su questo browser. Su iOS servono Safari 16.4+ e l'app installata da schermata Home.
            </p>
          )}
          {push.status === 'denied' && (
            <>
              <p className="text-[.77rem] text-ink-2 -mt-1">
                Permesso negato. Riabilita le notifiche per questo sito dalle impostazioni del browser
                (di solito dall'icona accanto alla barra degli indirizzi → Autorizzazioni sito → Notifiche),
                poi tocca "Riprova" qui sotto.
              </p>
              <button
                onClick={() => push.subscribe(houseId, userId)}
                disabled={push.loading}
                className={btnCls}
              >
                Riprova
              </button>
            </>
          )}
          {(push.status === 'inactive' || push.status === 'active') && (
            <>
              <p className="text-[.77rem] text-ink-2 -mt-1">
                Ricevi un promemoria quando e' il tuo turno.
              </p>
              <button
                onClick={() => push.status === 'active' ? push.unsubscribe(houseId) : push.subscribe(houseId, userId)}
                disabled={push.loading}
                className={btnCls}
              >
                {push.status === 'active' ? 'Disattiva notifiche' : 'Attiva notifiche'}
              </button>
            </>
          )}
        </section>

        {/* Regole — admin: sempre visibile (per poterle aggiungere); utente normale: solo se ce ne sono, in lettura */}
        {showRulesSection && (
          <section className={sectionCls}>
            <div className={titleCls + ' flex items-center gap-1.5'}><ClipboardList size={16} /> Regole</div>

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
                      <span className="flex items-center">
                        <RuleTypeIcon type={r.type} size={15} className="flex-shrink-0" />
                        <span className="ml-1.5">{describeRule(r, house.rooms, house.users)}</span>
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEditRule(r)} aria-label="Modifica" className={dangerCls + ' hover:text-brown hover:bg-cream-2'}><Pencil size={14} strokeWidth={1.8} /></button>
                        <button onClick={() => onRemoveRule(r.id)} aria-label="Elimina" className={dangerCls}><X size={14} strokeWidth={1.8} /></button>
                      </span>
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
                        <ArrowRight size={16} className="text-ink-2 flex-shrink-0" />
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

                    <div className="flex gap-2">
                      <button onClick={addRule} className={btnCls + ' self-start'}>
                        {editingRuleId ? 'Salva modifiche' : '+ Aggiungi regola'}
                      </button>
                      {editingRuleId && (
                        <button onClick={resetRuleForm} type="button" className={btnCls + ' self-start bg-transparent border-[1.5px] border-border text-ink-2 hover:bg-cream'}>
                          Annulla
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-1.5 mt-1">
                {house.rules.map(r => (
                  <div key={r.id} className="px-3 py-[9px] bg-cream rounded-[10px] border border-border text-[.83rem] flex items-center">
                    <RuleTypeIcon type={r.type} size={15} className="flex-shrink-0" />
                    <span className="ml-1.5">{describeRule(r, house.rooms, house.users)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Supporto */}
        <a
          href="https://buymeacoffee.com/dadaism0x"
          target="_blank"
          rel="noopener noreferrer"
          className={sectionCls + ' text-center no-underline hover:opacity-90 transition-opacity'}
        >
          <div className={titleCls + ' mb-0 flex items-center justify-center gap-1.5'}><Coffee size={16} /> Ti piace Il Cencio?</div>
          <p className="text-[.8rem] text-ink-2 flex items-center justify-center gap-1">
            Clicca qui per offrirmi un caffè e aiutarmi a tenerla sempre viva <Sparkles size={13} className="flex-shrink-0" />
          </p>
        </a>

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
