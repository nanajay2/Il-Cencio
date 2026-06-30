import { useState } from 'react';
import { api } from '../api.js';

const inputCls =
  'w-full border-[1.5px] border-border rounded-[12px] px-4 py-3 text-[.95rem] font-sans ' +
  'bg-white text-ink outline-none transition-colors focus:border-brown';

const labelCls = 'block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.06em]';

export function LoginScreen({ onSuccess, onBack }) {
  // step: 'code' | 'select' | 'pin' | 'set-pin'
  const [step,      setStep]      = useState('code');
  const [houseCode, setHouseCode] = useState('');
  const [house,     setHouse]     = useState(null);   // { houseId, houseName, users }
  const [selected,  setSelected]  = useState(null);   // { id, name, hasPin }
  const [pin,       setPin]       = useState('');
  const [pinConf,   setPinConf]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  async function handleLookup() {
    const code = houseCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true); setError(null);
    try {
      const res = await api.lookupHouse(code);
      setHouse(res);
      setStep('select');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectUser(user) {
    setSelected(user);
    setPin(''); setPinConf(''); setError(null);
    setStep(user.hasPin ? 'pin' : 'set-pin');
  }

  async function handleLogin() {
    if (pin.length !== 4) return;
    setLoading(true); setError(null);
    try {
      const session = await api.login(selected.id, pin);
      onSuccess(session);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPin() {
    if (!/^\d{4}$/.test(pin))  { setError('Il PIN deve essere di 4 cifre'); return; }
    if (pin !== pinConf)        { setError('I PIN non coincidono'); return; }
    setLoading(true); setError(null);
    try {
      await api.setPin(selected.id, houseCode.trim().toUpperCase(), pin);
      // dopo aver settato il PIN, fai login direttamente
      const session = await api.login(selected.id, pin);
      onSuccess(session);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Step: codice casa ──
  if (step === 'code') return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Accedi</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Inserisci il codice della tua casa</p>
      </div>

      <input
        type="text" value={houseCode}
        onChange={e => setHouseCode(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && handleLookup()}
        placeholder="es. CENCIO"
        maxLength={12}
        className="w-full max-w-[320px] border-[1.5px] border-border rounded-[14px] px-4 py-3.5 text-center text-[1.4rem] font-bold font-mono tracking-[.15em] bg-white text-brown outline-none focus:border-brown transition-colors"
      />

      {error && <p className="text-[.82rem] text-red-500 text-center max-w-[280px]">{error}</p>}

      <button
        onClick={handleLookup}
        disabled={loading || !houseCode.trim()}
        className="w-full max-w-[320px] bg-brown text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Cerco…' : 'Continua →'}
      </button>

      <button onClick={onBack} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1">
        ← Torna indietro
      </button>
    </div>
  );

  // ── Step: seleziona utente ──
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
            onClick={() => handleSelectUser(u)}
            className="w-full bg-card border border-border rounded-2xl py-3.5 px-4 text-left font-bold text-ink cursor-pointer hover:border-brown hover:bg-cream-2 transition-colors flex items-center justify-between"
          >
            <span>{u.name}</span>
            {!u.hasPin && <span className="text-[.65rem] font-normal text-ink-2 bg-cream-2 border border-border px-2 py-0.5 rounded-full">primo accesso</span>}
          </button>
        ))}
      </div>

      <button onClick={() => { setStep('code'); setError(null); }} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1">
        ← Cambia codice
      </button>
    </div>
  );

  // ── Step: inserisci PIN ──
  if (step === 'pin') return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Ciao, {selected.name}!</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Inserisci il tuo PIN</p>
      </div>

      <input
        type="password" inputMode="numeric" maxLength={4} autoFocus
        value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
        placeholder="• • • •"
        className="w-full max-w-[200px] border-[1.5px] border-border rounded-[14px] px-4 py-3.5 text-center text-[2rem] font-bold tracking-[.4em] bg-white text-brown outline-none focus:border-brown transition-colors"
      />

      {error && <p className="text-[.82rem] text-red-500 text-center max-w-[280px]">{error}</p>}

      <button
        onClick={handleLogin}
        disabled={loading || pin.length !== 4}
        className="w-full max-w-[320px] bg-brown text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Accesso…' : 'Entra →'}
      </button>

      <button onClick={() => { setStep('select'); setPin(''); setError(null); }} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1">
        ← Non sono io
      </button>
    </div>
  );

  // ── Step: imposta PIN (primo accesso) ──
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Benvenuta, {selected.name}!</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Scegli il tuo PIN per accedere</p>
      </div>

      <div className="w-full max-w-[320px] flex flex-col gap-3">
        <div>
          <label className={labelCls}>PIN (4 cifre)</label>
          <input
            type="password" inputMode="numeric" maxLength={4} autoFocus
            value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • •"
            className={`${inputCls} text-center text-[1.4rem] tracking-[.3em]`}
          />
        </div>
        <div>
          <label className={labelCls}>Conferma PIN</label>
          <input
            type="password" inputMode="numeric" maxLength={4}
            value={pinConf} onChange={e => setPinConf(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • •"
            className={`${inputCls} text-center text-[1.4rem] tracking-[.3em]`}
          />
        </div>
      </div>

      {error && <p className="text-[.82rem] text-red-500 text-center max-w-[280px]">{error}</p>}

      <button
        onClick={handleSetPin}
        disabled={loading || pin.length !== 4 || pinConf.length !== 4}
        className="w-full max-w-[320px] bg-brown text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Salvataggio…' : 'Salva PIN →'}
      </button>

      <button onClick={() => { setStep('select'); setPin(''); setPinConf(''); setError(null); }} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1">
        ← Non sono io
      </button>
    </div>
  );
}
