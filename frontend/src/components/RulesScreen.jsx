import { useState } from 'react';
import { X, Pencil, ClipboardList, ShowerHead, Workflow, Ban, ArrowRight } from 'lucide-react';
import { SubPage } from './SubPage.jsx';

const inputCls =
  'border-[1.5px] border-border rounded-[12px] px-3 py-2 text-[.84rem] font-sans ' +
  'bg-page text-ink outline-none h-11 transition-colors focus:border-primary flex-1 min-w-0';

const btnCls =
  'h-11 px-4 bg-primary text-white border-0 rounded-[12px] font-sans text-[.8rem] font-bold cursor-pointer hover:bg-primary-dark transition-colors whitespace-nowrap flex-shrink-0';

const dangerCls =
  'border-0 bg-transparent cursor-pointer text-ink-2 w-11 h-11 flex items-center justify-center rounded-[12px] transition-all hover:text-red hover:bg-red-pale';

const sectionCls = 'bg-card rounded-[20px] p-4 flex flex-col gap-3';
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
    const exempt = (config.exempt_user_ids ?? [])
      .filter(id => users.some(u => u.id === id))
      .map(userName);
    return `${roomName(config.from_room_id)} → ${roomName(config.to_room_id)} la settimana dopo` +
      (exempt.length ? ` (tranne ${exempt.join(', ')})` : '');
  }
  if (type === 'exclusion') {
    return `${userName(config.user_id)} mai su ${roomName(config.room_id)}`;
  }
  return JSON.stringify(config);
}

export function RulesScreen({
  house, isAdmin,
  onClose,
  onAddRule, onEditRule, onRemoveRule,
}) {

  // Rules state
  const [ruleType,   setRuleType]   = useState(RULE_TYPES[0].value);
  const [poolRoom,   setPoolRoom]   = useState('');
  const [poolUsers,  setPoolUsers]  = useState([]);
  const [seqFrom,    setSeqFrom]    = useState('');
  const [seqTo,      setSeqTo]      = useState('');
  const [seqExempt,  setSeqExempt]  = useState([]);
  const [exclUser,   setExclUser]   = useState('');
  const [exclRoom,   setExclRoom]   = useState('');
  const [editingRuleId, setEditingRuleId] = useState(null);

  function toggleAllowedUser(id) {
    setPoolUsers(ids => ids.includes(id) ? ids.filter(u => u !== id) : [...ids, id]);
  }

  function toggleSeqExempt(id) {
    setSeqExempt(ids => ids.includes(id) ? ids.filter(u => u !== id) : [...ids, id]);
  }

  function resetRuleForm() {
    setEditingRuleId(null);
    setPoolRoom(''); setPoolUsers([]);
    setSeqFrom(''); setSeqTo(''); setSeqExempt([]);
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
      setSeqExempt((config.exempt_user_ids ?? []).filter(id => house.users.some(u => u.id === id)));
    } else if (rule.type === 'exclusion') {
      setExclUser(config.user_id);
      setExclRoom(config.room_id);
    }
  }

  async function addRule() {
    if (ruleType === 'pool_restriction') {
      if (!poolRoom || poolUsers.length === 0) return;
      const config = { room_id: poolRoom, user_ids: poolUsers };
      if (editingRuleId) await onEditRule(editingRuleId, 'pool_restriction', config);
      else await onAddRule('pool_restriction', config);
      resetRuleForm();
    } else if (ruleType === 'sequence') {
      if (!seqFrom || !seqTo || seqFrom === seqTo) return;
      const config = { from_room_id: seqFrom, to_room_id: seqTo };
      if (seqExempt.length) config.exempt_user_ids = seqExempt;
      if (editingRuleId) await onEditRule(editingRuleId, 'sequence', config);
      else await onAddRule('sequence', config);
      resetRuleForm();
    } else if (ruleType === 'exclusion') {
      if (!exclUser || !exclRoom) return;
      const config = { user_id: exclUser, room_id: exclRoom };
      if (editingRuleId) await onEditRule(editingRuleId, 'exclusion', config);
      else await onAddRule('exclusion', config);
      resetRuleForm();
    }
  }

  return (
    <SubPage title="Regole" onBack={onClose}>

        {/* Admin: può modificarle; utente normale: solo in lettura */}
          <section className={sectionCls}>

            {isAdmin ? (
              <>
                <p className="text-[.77rem] text-ink-2 -mt-1">
                  Le regole controllano chi può fare cosa e in quale ordine.
                </p>

                <div className="flex flex-col gap-1.5 mt-1">
                  {house.rules.length === 0 ? (
                    <p className="text-[.82rem] text-ink-2">Nessuna regola configurata.</p>
                  ) : house.rules.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-3 py-[9px] bg-page rounded-[12px] border border-border text-[.83rem]">
                      <span className="flex items-center">
                        <RuleTypeIcon type={r.type} size={15} className="flex-shrink-0" />
                        <span className="ml-1.5">{describeRule(r, house.rooms, house.users)}</span>
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEditRule(r)} aria-label="Modifica regola" className={dangerCls + ' hover:text-primary hover:bg-soft'}><Pencil size={18} strokeWidth={1.8} /></button>
                        <button onClick={() => onRemoveRule(r.id)} aria-label="Elimina regola" className={dangerCls}><X size={18} strokeWidth={1.8} /></button>
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
                            {house.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
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
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-page text-ink-2 border-border')
                                }
                              >
                                {u.name}
                              </button>
                            ))}
                          </div>
                      </>
                    )}

                    {ruleType === 'sequence' && (
                      <>
                      <div className="flex items-center gap-2">
                        <select value={seqFrom} onChange={e => setSeqFrom(e.target.value)} className={selectCls}>
                          <option value="">Stanza di partenza…</option>
                          {house.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <ArrowRight size={16} className="text-ink-2 flex-shrink-0" />
                        <select value={seqTo} onChange={e => setSeqTo(e.target.value)} className={selectCls}>
                          <option value="">Stanza successiva…</option>
                          {house.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                      <p className="text-[.75rem] text-ink-2">Non si applica a (opzionale):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {house.users.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleSeqExempt(u.id)}
                            className={
                              'px-3 py-1.5 rounded-full text-[.78rem] font-semibold border-[1.5px] transition-colors cursor-pointer ' +
                              (seqExempt.includes(u.id)
                                ? 'bg-primary text-white border-primary'
                                : 'bg-page text-ink-2 border-border')
                            }
                          >
                            {u.name}
                          </button>
                        ))}
                      </div>
                      </>
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
                          {house.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={addRule} className={btnCls + ' self-start'}>
                        {editingRuleId ? 'Salva modifiche' : '+ Aggiungi regola'}
                      </button>
                      {editingRuleId && (
                        <button onClick={resetRuleForm} type="button" className={btnCls + ' self-start bg-transparent border-[1.5px] border-border text-ink-2 hover:bg-page'}>
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
                  <div key={r.id} className="px-3 py-[9px] bg-page rounded-[12px] border border-border text-[.83rem] flex items-center">
                    <RuleTypeIcon type={r.type} size={15} className="flex-shrink-0" />
                    <span className="ml-1.5">{describeRule(r, house.rooms, house.users)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
    </SubPage>
  );
}
