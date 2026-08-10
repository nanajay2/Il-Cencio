import { LogIn, Home, LogOut } from 'lucide-react';

// Mostrata dopo l'autenticazione Supabase quando l'identità non è
// (ancora) collegata a nessuna casa: primo accesso in assoluto, o
// scelta di aggiungerne una nuova dallo switcher.
export function ChooseHouseScreen({ onJoin, onCreate, onBack, onLogout }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-2">
        <div className="font-serif text-[1.8rem] text-brown">Cosa vuoi fare?</div>
        <p className="text-[.85rem] text-ink-2 mt-1 max-w-[320px]">
          Sei autenticata/o. Entra in una casa che ti ha invitato, o creane una nuova.
        </p>
      </div>

      <button
        onClick={onJoin}
        className="w-full max-w-[320px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors flex items-center justify-center gap-1.5"
      >
        <LogIn size={18} /> Entra in una casa
      </button>

      <button
        onClick={onCreate}
        className="w-full max-w-[320px] bg-transparent text-ink-2 font-semibold text-[.9rem] rounded-2xl py-3 border-0 cursor-pointer hover:text-brown transition-colors flex items-center justify-center gap-1.5"
      >
        <Home size={16} /> Crea una nuova casa
      </button>

      {onBack && (
        <button onClick={onBack} className="text-[.82rem] text-ink-2 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1">
          Torna indietro
        </button>
      )}

      {onLogout && (
        <button onClick={onLogout} className="text-[.78rem] text-ink-2/70 border-0 bg-transparent cursor-pointer hover:text-brown transition-colors py-1 flex items-center gap-1 mt-2">
          <LogOut size={13} /> Esci
        </button>
      )}
    </div>
  );
}
