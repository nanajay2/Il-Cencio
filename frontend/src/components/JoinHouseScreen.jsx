import { useState } from 'react';
import { ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { api } from '../api.js';

const inputCls =
  'w-full border-[1.5px] border-border rounded-[12px] px-4 py-3 text-[.95rem] font-sans ' +
  'bg-card text-ink outline-none transition-colors focus:border-brown';

const labelCls = 'block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.06em]';

export function JoinHouseScreen({ onSuccess, onBack }) {
  const [step,      setStep]      = useState(1); // 1=codice, 2=dati
  const [houseCode, setHouseCode] = useState('');
  const [houseName, setHouseName] = useState('');
  const [houseId,   setHouseId]   = useState('');
  const [name,    setName]    = useState('');
  const [pin,     setPin]     = useState('');
  const [pinConf, setPinConf] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  async function handleLookup() {
    const code = houseCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.lookupHouse(code);
      setHouseId(res.houseId);
      setHouseName(res.houseName);
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!name.trim() || !pin || !pinConf) return;
    if (!/^\d{4}$/.test(pin))  { setError('Il PIN deve essere di 4 cifre'); return; }
    if (pin !== pinConf)        { setError('I PIN non coincidono'); return; }
    setLoading(true);
    setError(null);
    try {
      const session = await api.register(houseCode.trim().toUpperCase(), name.trim(), pin);
      onSuccess(session);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 1) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Unisciti alla casa</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Inserisci il codice che ti ha condiviso l'admin</p>
      </div>

      <input
        type="text"
        value={houseCode}
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

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="text-[.8rem] text-ink-2 uppercase tracking-[.08em]">Ti stai unendo a</div>
        <div className="font-serif text-[2rem] text-brown">{houseName}</div>
      </div>

      <div className="w-full max-w-[360px] flex flex-col gap-3">
        <div>
          <label className={labelCls}>Il tuo nome</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="es. Silvia" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Scegli un PIN (4 cifre)</label>
          <input
            type="password" inputMode="numeric" maxLength={4}
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

      {error && <p className="text-[.82rem] text-red text-center max-w-[320px]">{error}</p>}

      <button
        onClick={handleRegister}
        disabled={loading || !name.trim() || pin.length !== 4 || pinConf.length !== 4}
        className="w-full max-w-[360px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {loading ? 'Registrazione…' : <>Entra <Home size={18} /></>}
      </button>

      <button onClick={() => { setStep(1); setError(null); }} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1 flex items-center gap-1">
        <ArrowLeft size={14} /> Cambia codice
      </button>
    </div>
  );
}
