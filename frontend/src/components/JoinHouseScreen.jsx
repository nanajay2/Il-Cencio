import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../api.js';

const inputCls =
  'w-full border-[1.5px] border-border rounded-[12px] px-4 py-3 text-[.95rem] font-sans ' +
  'bg-card text-ink outline-none transition-colors focus:border-brown';

const labelCls = 'block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.06em]';

// Va usata quando l'identità Supabase è già autenticata (sessione
// attiva): collega quell'identità a un coinquilino di una casa
// esistente tramite POST /houses/claim, o ne crea uno nuovo.
//
// `initialToken` (FEAT-06, link/QR aperto da /join/:token): salta lo
// step del codice e risolve direttamente la casa. Un token personale
// (invito per un coinquilino specifico) salta anche la lista e va dritto
// alla conferma; un token casa mostra la stessa lista del vecchio flusso
// col codice, solo che il "codice" è invisibile all'utente.
export function JoinHouseScreen({ onSuccess, onBack, initialToken }) {
  // step: 'resolving' | 'code' | 'select' | 'new-name' | 'confirm-personal'
  const [step,      setStep]      = useState(initialToken ? 'resolving' : 'code');
  const [houseCode, setHouseCode] = useState('');
  const [house,     setHouse]     = useState(null); // { houseId, houseName, users }
  const [newName,   setNewName]   = useState('');
  const [personal,  setPersonal]  = useState(null); // { userName, houseName } per token personale
  const [source,    setSource]    = useState(null); // { token } | { houseCode }
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!initialToken) return;
    (async () => {
      try {
        const invite = await api.resolveInvite(initialToken);
        setSource({ token: initialToken });
        if (invite.userId) {
          setPersonal({ userName: invite.userName, houseName: invite.houseName });
          setStep('confirm-personal');
        } else {
          setHouse(await api.getHouseMembers(invite.houseId));
          setStep('select');
        }
      } catch (e) {
        setError(e.message);
        setStep('code');
      }
    })();
  }, [initialToken]);

  async function handleLookup() {
    const code = houseCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true); setError(null);
    try {
      const res = await api.lookupHouse(code);
      setHouse(res);
      setSource({ houseCode: code });
      setStep('select');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function claim(opts = {}) {
    setLoading(true); setError(null);
    try {
      const membership = await api.claim({ ...source, ...opts });
      onSuccess(membership);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimSlot(user) {
    if (!user.claimed) claim({ userId: user.id });
  }

  async function handleRegisterNew() {
    if (!newName.trim()) { setError('Inserisci il tuo nome'); return; }
    claim({ name: newName.trim() });
  }

  // ── Step: risoluzione token in corso ───────────────────────────────
  if (step === 'resolving') return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brown" />
    </div>
  );

  // ── Step: conferma invito personale (token per un coinquilino specifico) ──
  if (step === 'confirm-personal') return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="text-[.8rem] text-ink-2 uppercase tracking-[.08em]">{personal.houseName}</div>
        <div className="font-serif text-[1.8rem] text-brown">Ciao, {personal.userName}!</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Confermi di essere tu?</p>
      </div>

      {error && <p className="text-[.82rem] text-red text-center max-w-[280px]">{error}</p>}

      <button
        onClick={() => claim()}
        disabled={loading}
        className="w-full max-w-[320px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {loading ? 'Un attimo…' : <>Sì, sono io <ArrowRight size={18} /></>}
      </button>

      <button onClick={onBack} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1 flex items-center gap-1">
        <ArrowLeft size={14} /> Non sono io
      </button>
    </div>
  );

  // ── Step: codice casa ─────────────────────────────────────────────
  if (step === 'code') return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Entra in una casa</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Inserisci il codice della casa</p>
      </div>

      <input
        type="text" value={houseCode}
        onChange={e => setHouseCode(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && handleLookup()}
        placeholder="es. CENCIO"
        maxLength={12}
        className="w-full max-w-[320px] border-[1.5px] border-border rounded-[14px] px-4 py-3.5 text-center text-[1.4rem] font-bold font-mono tracking-[.15em] bg-card text-brown outline-none focus:border-brown transition-colors"
      />

      {error && <p className="text-[.82rem] text-red text-center max-w-[280px]">{error}</p>}

      <button
        onClick={handleLookup}
        disabled={loading || !houseCode.trim()}
        className="w-full max-w-[320px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {loading ? 'Cerco…' : <>Continua <ArrowRight size={18} /></>}
      </button>

      <button onClick={onBack} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1 flex items-center gap-1">
        <ArrowLeft size={14} /> Torna indietro
      </button>
    </div>
  );

  // ── Step: seleziona chi sei ────────────────────────────────────────
  if (step === 'select') return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="text-[.8rem] text-ink-2 uppercase tracking-[.08em]">{house.houseName}</div>
        <div className="font-serif text-[1.8rem] text-brown">Chi sei?</div>
      </div>

      <div className="w-full max-w-[320px] flex flex-col gap-2">
        {house.users.map(u => (
          <button
            key={u.id}
            onClick={() => handleClaimSlot(u)}
            disabled={loading || u.claimed}
            className={
              'w-full border rounded-2xl py-3.5 px-4 text-left font-bold cursor-pointer transition-colors flex items-center justify-between ' +
              (u.claimed
                ? 'bg-cream-2 border-border text-ink-2 cursor-not-allowed'
                : 'bg-card border-border text-ink hover:border-brown hover:bg-cream-2')
            }
          >
            <span>{u.name}</span>
            {u.claimed && <span className="text-[.65rem] font-normal text-ink-2 bg-cream border border-border px-2 py-0.5 rounded-full">già attivo</span>}
          </button>
        ))}

        <button
          onClick={() => { setError(null); setNewName(''); setStep('new-name'); }}
          className="w-full border border-dashed border-border rounded-2xl py-3.5 px-4 text-center text-[.9rem] text-ink-2 cursor-pointer hover:border-brown hover:text-brown transition-colors bg-transparent"
        >
          + Sono nuovo, non sono in lista
        </button>
      </div>

      {error && <p className="text-[.82rem] text-red text-center max-w-[280px]">{error}</p>}

      {!initialToken && (
        <button onClick={() => { setStep('code'); setError(null); }} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1 flex items-center gap-1">
          <ArrowLeft size={14} /> Cambia codice
        </button>
      )}
    </div>
  );

  // ── Step: nuovo coinquilino (solo nome, l'identità è già autenticata) ──
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Come ti chiami?</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Sarai aggiunto a {house.houseName}</p>
      </div>

      <div className="w-full max-w-[320px]">
        <label className={labelCls}>Il tuo nome</label>
        <input
          type="text" autoFocus value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRegisterNew()}
          placeholder="es. Marco"
          className={inputCls}
        />
      </div>

      {error && <p className="text-[.82rem] text-red text-center max-w-[280px]">{error}</p>}

      <button
        onClick={handleRegisterNew}
        disabled={loading || !newName.trim()}
        className="w-full max-w-[320px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {loading ? 'Un attimo…' : <>Entra <ArrowRight size={18} /></>}
      </button>

      <button onClick={() => { setStep('select'); setError(null); }} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1 flex items-center gap-1">
        <ArrowLeft size={14} /> Torna alla lista
      </button>
    </div>
  );
}
