import { useState } from 'react';
import { api } from '../api.js';

const inputCls =
  'w-full border-[1.5px] border-border rounded-[12px] px-4 py-3 text-[.95rem] font-sans ' +
  'bg-white text-ink outline-none transition-colors focus:border-brown';

const labelCls = 'block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.06em]';

export function LoginScreen({ onSuccess, onBack }) {
  // step: 'email' | 'pin' | 'set-pin'
  const [step,    setStep]    = useState('email');
  const [email,   setEmail]   = useState('');
  const [pin,     setPin]     = useState('');
  const [pinConf, setPinConf] = useState('');
  const [pending, setPending] = useState(null); // utente legacy in attesa di settare il PIN
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleEmailNext() {
    if (!email.trim()) return;
    setStep('pin');
    setError(null);
  }

  async function handleLogin() {
    if (!pin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email.trim(), pin);
      if (res.needsPin) {
        setPending(res);
        setPin('');
        setStep('set-pin');
        return;
      }
      onSuccess(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPin() {
    if (!/^\d{4}$/.test(pin))  { setError('Il PIN deve essere di 4 cifre'); return; }
    if (pin !== pinConf)        { setError('I PIN non coincidono'); return; }
    setLoading(true);
    setError(null);
    try {
      await api.setPin(pending.userId, pin);
      onSuccess(pending);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'set-pin') return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Benvenuta, {pending?.userName}!</div>
        <p className="text-[.85rem] text-ink-2 mt-1">È la prima volta che accedi — scegli il tuo PIN</p>
      </div>

      <div className="w-full max-w-[320px] flex flex-col gap-3">
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

      {error && <p className="text-[.82rem] text-red-500 text-center max-w-[280px]">{error}</p>}

      <button
        onClick={handleSetPin}
        disabled={loading || pin.length !== 4 || pinConf.length !== 4}
        className="w-full max-w-[320px] bg-brown text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Salvataggio…' : 'Salva PIN →'}
      </button>
    </div>
  );

  if (step === 'pin') return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Inserisci il PIN</div>
        <p className="text-[.85rem] text-ink-2 mt-1">{email}</p>
      </div>

      <input
        type="password" inputMode="numeric" maxLength={4} autoFocus
        value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
        placeholder="• • • •"
        className="w-full max-w-[220px] border-[1.5px] border-border rounded-[14px] px-4 py-3.5 text-center text-[2rem] font-bold tracking-[.4em] bg-white text-brown outline-none focus:border-brown transition-colors"
      />

      {error && <p className="text-[.82rem] text-red-500 text-center max-w-[280px]">{error}</p>}

      <button
        onClick={handleLogin}
        disabled={loading || pin.length !== 4}
        className="w-full max-w-[320px] bg-brown text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Accesso…' : 'Entra →'}
      </button>

      <button onClick={() => { setStep('email'); setPin(''); setError(null); }} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1">
        ← Cambia email
      </button>
    </div>
  );

  // step === 'email'
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Accedi</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Inserisci la tua email per continuare</p>
      </div>

      <input
        type="email" value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleEmailNext()}
        placeholder="la-tua@email.com"
        className="w-full max-w-[320px] border-[1.5px] border-border rounded-[14px] px-4 py-3.5 text-center text-[1rem] bg-white text-ink outline-none focus:border-brown transition-colors"
      />

      {error && <p className="text-[.82rem] text-red-500 text-center max-w-[280px]">{error}</p>}

      <button
        onClick={handleEmailNext}
        disabled={!email.trim()}
        className="w-full max-w-[320px] bg-brown text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continua →
      </button>

      <button onClick={onBack} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1">
        ← Torna indietro
      </button>
    </div>
  );
}
