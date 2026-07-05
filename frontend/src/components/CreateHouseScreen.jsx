import { useState } from 'react';
import { api } from '../api.js';

const inputCls =
  'w-full border-[1.5px] border-border rounded-[12px] px-4 py-3 text-[.95rem] font-sans ' +
  'bg-card text-ink outline-none transition-colors focus:border-brown';

const labelCls = 'block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.06em]';

const pillCls = (active) =>
  'px-3 py-1.5 rounded-full text-[.78rem] font-semibold border-[1.5px] transition-colors cursor-pointer ' +
  (active ? 'bg-brown text-ink border-brown' : 'bg-cream text-ink-2 border-border');

const ROTATIONS = [
  { value: 'weekly',  label: 'Settimanale' },
  { value: 'daily',   label: 'Giornaliera personalizzata' },
  { value: 'monthly', label: 'Mensile' },
];

export function CreateHouseScreen({ onSuccess, onBack }) {
  const [step, setStep] = useState(1); // 1=casa, 2=coinquilini, 3=rotazione, 4=codice invito
  const [session, setSession] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Step 1
  const [houseName, setHouseName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [pin,       setPin]       = useState('');
  const [pinConf,   setPinConf]   = useState('');

  // Step 2
  const [pendingNames, setPendingNames] = useState([]);
  const [nameInput,    setNameInput]    = useState('');

  // Step 3
  const [rotationType, setRotationType] = useState('weekly');
  const [rotationDays, setRotationDays] = useState(3);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleCreate() {
    if (!houseName.trim() || !adminName.trim() || !pin || !pinConf) return;
    if (!/^\d{4}$/.test(pin)) { setError('Il PIN deve essere di 4 cifre'); return; }
    if (pin !== pinConf)       { setError('I PIN non coincidono'); return; }
    setLoading(true);
    setError(null);
    try {
      const s = await api.createHouse(houseName.trim(), adminName.trim(), pin);
      setSession(s);
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function addPendingName() {
    const name = nameInput.trim();
    if (!name) return;
    setPendingNames(names => [...names, name]);
    setNameInput('');
  }

  function removePendingName(i) {
    setPendingNames(names => names.filter((_, idx) => idx !== i));
  }

  async function handleCoinquiliniContinue() {
    setLoading(true);
    setError(null);
    try {
      for (const name of pendingNames) {
        await api.createUser(session.houseId, name, '');
      }
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    if (rotationType === 'daily' && !(Number.isInteger(rotationDays) && rotationDays >= 1 && rotationDays <= 30)) {
      setError('Scegli un numero di giorni tra 1 e 30');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.updateRotation(session.houseId, rotationType, rotationType === 'daily' ? rotationDays : null);
      setStep(4);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmitStep1 = houseName.trim() && adminName.trim() && pin.length === 4 && pinConf.length === 4;

  // ── Step 1: casa + admin + PIN ─────────────────────────────────────
  if (step === 1) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Crea la tua casa</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Configurerai stanze e coinquilini dopo</p>
      </div>

      <div className="w-full max-w-[360px] flex flex-col gap-3">
        <div>
          <label className={labelCls}>Nome della casa</label>
          <input type="text" value={houseName} onChange={e => setHouseName(e.target.value)} placeholder="es. Il Cencio" className={inputCls} />
          <p className="text-[.73rem] text-ink-2 mt-1">
            ⚠️ Evita di usare il tuo indirizzo reale (via, numero civico): scegli un nome di fantasia. Questo nome può finire nell'URL e nel codice condiviso con altri.
          </p>
        </div>
        <div>
          <label className={labelCls}>Il tuo nome</label>
          <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="es. Giada" className={inputCls} />
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
        onClick={handleCreate}
        disabled={loading || !canSubmitStep1}
        className="w-full max-w-[360px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creazione…' : 'Continua →'}
      </button>

      <button onClick={onBack} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1">
        ← Torna indietro
      </button>
    </div>
  );

  // ── Step 2: coinquilini ─────────────────────────────────────────────
  if (step === 2) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Coinquilini</div>
        <p className="text-[.85rem] text-ink-2 mt-1">
          Aggiungi chi vivrà in questa casa: potranno accedere scegliendo solo nome e PIN. Potrai farlo anche dopo.
        </p>
      </div>

      <div className="w-full max-w-[360px] flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text" value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPendingName()}
            placeholder="es. Marco"
            className={inputCls}
          />
          <button
            onClick={addPendingName}
            className="px-4 bg-brown text-ink font-bold text-[.85rem] rounded-[12px] border-0 cursor-pointer hover:bg-brown-mid transition-colors flex-shrink-0"
          >
            Aggiungi
          </button>
        </div>

        {pendingNames.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {pendingNames.map((name, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-[9px] bg-card rounded-[10px] border border-border text-[.83rem]">
                <span className="font-semibold text-ink">{name}</span>
                <button
                  onClick={() => removePendingName(i)}
                  className="border-0 bg-transparent cursor-pointer text-ink-2 hover:text-red transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-[.82rem] text-red text-center max-w-[320px]">{error}</p>}

      <button
        onClick={handleCoinquiliniContinue}
        disabled={loading}
        className="w-full max-w-[360px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Salvataggio…' : 'Continua →'}
      </button>

      <button
        onClick={() => setStep(3)}
        className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1"
      >
        Salta, li aggiungo dopo →
      </button>
    </div>
  );

  // ── Step 3: rotazione ────────────────────────────────────────────────
  if (step === 3) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Rotazione</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Con che frequenza ruotano i turni?</p>
      </div>

      <div className="w-full max-w-[360px] flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ROTATIONS.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRotationType(r.value)}
              className={pillCls(rotationType === r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {rotationType === 'daily' && (
          <div>
            <label className={labelCls}>Ogni quanti giorni</label>
            <input
              type="number" min={1} max={30}
              value={rotationDays}
              onChange={e => setRotationDays(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        )}
      </div>

      {error && <p className="text-[.82rem] text-red text-center max-w-[320px]">{error}</p>}

      <button
        onClick={handleFinish}
        disabled={loading}
        className="w-full max-w-[360px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creazione…' : 'Crea casa 🏠'}
      </button>
    </div>
  );

  // ── Step 4: codice invito casa ────────────────────────────────────────
  function copyHouseCode() {
    navigator.clipboard.writeText(session.houseInviteCode ?? '');
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="text-[2.4rem]">🎉</div>
        <div className="font-serif text-[1.8rem] text-brown">Casa creata!</div>
        <p className="text-[.85rem] text-ink-2 mt-1 max-w-[340px]">
          Questo è il <strong>codice invito</strong> della tua casa: condividilo con i coinquilini
          che vuoi far entrare, così potranno registrarsi da soli scegliendo nome e PIN.
          Lo trovi anche in seguito da ⚙️ Impostazioni.
        </p>
      </div>

      <div className="w-full max-w-[360px] flex items-center gap-2">
        <code className="flex-1 text-center text-[1.4rem] font-mono font-bold tracking-[.15em] bg-card border-[1.5px] border-border rounded-[12px] py-3 text-brown">
          {session?.houseInviteCode}
        </code>
        <button
          onClick={copyHouseCode}
          className="px-4 py-3 bg-brown text-ink font-bold text-[.85rem] rounded-[12px] border-0 cursor-pointer hover:bg-brown-mid transition-colors flex-shrink-0"
        >
          {codeCopied ? '✅ Copiato' : 'Copia'}
        </button>
      </div>

      <button
        onClick={() => onSuccess(session)}
        className="w-full max-w-[360px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors mt-2"
      >
        Vai all'app →
      </button>
    </div>
  );
}
