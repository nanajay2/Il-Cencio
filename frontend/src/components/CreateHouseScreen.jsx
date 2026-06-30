import { useState } from 'react';
import { api } from '../api.js';

const inputCls =
  'w-full border-[1.5px] border-border rounded-[12px] px-4 py-3 text-[.95rem] font-sans ' +
  'bg-white text-ink outline-none transition-colors focus:border-brown';

const labelCls = 'block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.06em]';

export function CreateHouseScreen({ onSuccess, onBack }) {
  const [houseName,  setHouseName]  = useState('');
  const [adminName,  setAdminName]  = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [pin,        setPin]        = useState('');
  const [pinConf,    setPinConf]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  async function handleCreate() {
    if (!houseName.trim() || !adminName.trim() || !adminEmail.trim() || !pin || !pinConf) return;
    if (!/^\d{4}$/.test(pin)) { setError('Il PIN deve essere di 4 cifre'); return; }
    if (pin !== pinConf)       { setError('I PIN non coincidono'); return; }
    setLoading(true);
    setError(null);
    try {
      const session = await api.createHouse(houseName.trim(), adminName.trim(), adminEmail.trim(), pin);
      onSuccess(session);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = houseName.trim() && adminName.trim() && adminEmail.trim() && pin.length === 4 && pinConf.length === 4;

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Crea la tua casa</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Configurerai stanze e coinquilini dopo</p>
      </div>

      <div className="w-full max-w-[360px] flex flex-col gap-3">
        <div>
          <label className={labelCls}>Nome della casa</label>
          <input type="text" value={houseName} onChange={e => setHouseName(e.target.value)} placeholder="es. Via Risorgimento" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Il tuo nome</label>
          <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="es. Giada" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>La tua email</label>
          <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="giada@example.com" className={inputCls} />
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

      {error && <p className="text-[.82rem] text-red-500 text-center max-w-[320px]">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={loading || !canSubmit}
        className="w-full max-w-[360px] bg-brown text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creazione…' : 'Crea casa 🏠'}
      </button>

      <button onClick={onBack} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1">
        ← Torna indietro
      </button>
    </div>
  );
}
