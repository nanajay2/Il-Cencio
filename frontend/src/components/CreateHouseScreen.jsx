import { useState } from 'react';
import { TriangleAlert, X, Home, PartyPopper, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../api.js';

const inputCls =
  'w-full border-[1.5px] border-border rounded-[12px] px-4 py-3 text-[.95rem] font-sans ' +
  'bg-card text-ink outline-none transition-colors focus:border-primary';

const labelCls = 'block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.06em]';

const pillCls = (active) =>
  'px-3 py-1.5 rounded-full text-[.78rem] font-semibold border-[1.5px] transition-colors cursor-pointer ' +
  (active ? 'bg-primary text-white border-primary' : 'bg-page text-ink-2 border-border');

const ROTATIONS = [
  { value: 'weekly',  label: 'Settimanale' },
  { value: 'daily',   label: 'Giornaliera personalizzata' },
  { value: 'monthly', label: 'Mensile' },
];

export function CreateHouseScreen({ onSuccess, onBack }) {
  const [step, setStep] = useState(1); // 1=casa, 2=coinquilini, 3=rotazione, 4=casa creata
  const [session, setSession] = useState(null);

  // Step 1
  const [houseName, setHouseName] = useState('');
  const [adminName, setAdminName] = useState('');

  // Step 2
  const [pendingNames, setPendingNames] = useState([]);
  const [nameInput,    setNameInput]    = useState('');

  // Step 3
  const [rotationType, setRotationType] = useState('weekly');
  const [rotationDays, setRotationDays] = useState(3);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  function addPendingName() {
    const name = nameInput.trim();
    if (!name) return;
    setPendingNames(names => [...names, name]);
    setNameInput('');
  }

  function removePendingName(i) {
    setPendingNames(names => names.filter((_, idx) => idx !== i));
  }

  // La casa viene creata solo qui, all'ultimo passo: fino ad allora si può
  // tornare indietro e cambiare tutto. Se qualcosa fallisce a metà, "Crea casa"
  // riprende da dove si era fermato senza creare una seconda casa.
  async function handleFinish() {
    if (rotationType === 'daily' && !(Number.isInteger(rotationDays) && rotationDays >= 1 && rotationDays <= 30)) {
      setError('Scegli un numero di giorni tra 1 e 30');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let created = session;
      if (!created) {
        created = await api.createHouse(houseName.trim(), adminName.trim());
        setSession(created);
      }
      for (const name of pendingNames) {
        await api.createUser(created.houseId, name, '');
        setPendingNames(names => names.slice(1));
      }
      await api.updateRotation(created.houseId, rotationType, rotationType === 'daily' ? rotationDays : null);
      setStep(4);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmitStep1 = houseName.trim() && adminName.trim();

  // ── Step 1: casa + admin ─────────────────────────────────────────────
  if (step === 1) return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-display font-extrabold text-[1.8rem] text-primary">Crea la tua casa</div>
        <p className="text-[.85rem] text-ink-2 mt-1">Configurerai stanze e coinquilini dopo</p>
      </div>

      <div className="w-full max-w-[360px] flex flex-col gap-3">
        <div>
          <label className={labelCls}>Nome della casa</label>
          <input type="text" value={houseName} onChange={e => setHouseName(e.target.value)} placeholder="es. Il Cencio" className={inputCls} />
          <p className="text-[.73rem] text-ink-2 mt-1 flex items-start gap-1">
            <TriangleAlert size={14} className="flex-shrink-0 mt-0.5" />
            Evita di usare il tuo indirizzo reale (via, numero civico): scegli un nome di fantasia. Lo vedrà chi riceve un invito.
          </p>
        </div>
        <div>
          <label className={labelCls}>Il tuo nome</label>
          <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="es. Giada" className={inputCls} />
        </div>
      </div>

      {error && <p className="text-[.82rem] text-red text-center max-w-[320px]">{error}</p>}

      <button
        onClick={() => setStep(2)}
        disabled={!canSubmitStep1}
        className="w-full max-w-[360px] bg-primary text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        Continua <ArrowRight size={18} />
      </button>

      <button onClick={onBack} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-primary transition-colors py-1 flex items-center gap-1">
        <ArrowLeft size={14} /> Torna indietro
      </button>
    </div>
  );

  // ── Step 2: coinquilini ─────────────────────────────────────────────
  if (step === 2) return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-display font-extrabold text-[1.8rem] text-primary">Coinquilini</div>
        <p className="text-[.85rem] text-ink-2 mt-1">
          Aggiungi chi vivrà in questa casa: potranno attivare il proprio accesso con la loro email. Potrai farlo anche dopo.
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
            className="px-4 bg-primary text-white font-bold text-[.85rem] rounded-[12px] border-0 cursor-pointer hover:bg-primary-dark transition-colors flex-shrink-0"
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
                  <X size={14} strokeWidth={1.8} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-[.82rem] text-red text-center max-w-[320px]">{error}</p>}

      <button
        onClick={() => setStep(3)}
        className="w-full max-w-[360px] bg-primary text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-primary-dark transition-colors flex items-center justify-center gap-1.5"
      >
        {pendingNames.length > 0 ? 'Continua' : 'Salta, li aggiungo dopo'} <ArrowRight size={18} />
      </button>

      <button onClick={() => setStep(1)} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-primary transition-colors py-1 flex items-center gap-1">
        <ArrowLeft size={14} /> Torna indietro
      </button>
    </div>
  );

  // ── Step 3: rotazione ────────────────────────────────────────────────
  if (step === 3) return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-display font-extrabold text-[1.8rem] text-primary">Rotazione</div>
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
        className="w-full max-w-[360px] bg-primary text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {loading ? 'Creazione…' : <>Crea casa <Home size={18} /></>}
      </button>

      {!session && <button onClick={() => { setError(null); setStep(2); }} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-primary transition-colors py-1 flex items-center gap-1">
        <ArrowLeft size={14} /> Torna indietro
      </button>}
    </div>
  );

  // ── Step 4: casa creata, si invita dai Coinquilini ─────────────────
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="flex justify-center text-primary"><PartyPopper size={40} /></div>
        <div className="font-display font-extrabold text-[1.8rem] text-primary">Casa creata!</div>
        <p className="text-[.85rem] text-ink-2 mt-1 max-w-[340px]">
          Per far entrare i coinquilini apri <Users size={13} className="inline align-[-2px]" /> Coinquilini
          e condividi il <strong>link d'invito</strong> o il QR: potranno registrarsi da soli con la propria email.
        </p>
      </div>

      <button
        onClick={() => onSuccess(session)}
        className="w-full max-w-[360px] bg-primary text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-primary-dark transition-colors mt-2 flex items-center justify-center gap-1.5"
      >
        Vai all'app <ArrowRight size={18} />
      </button>
    </div>
  );
}
