import { ArrowRight, ShieldCheck } from 'lucide-react';

// US-05.2: avviso in-app per chi aveva un account PIN-based su questo
// device (localStorage legacy da prima di FEAT-01/02). Il vecchio PIN
// non funziona più: va spiegato, non lasciato sparire in silenzio.
export function UpgradeNoticeScreen({ onContinue }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="flex justify-center text-brown"><ShieldCheck size={40} /></div>
      <div className="text-center mb-1">
        <div className="font-serif text-[1.7rem] text-brown">Abbiamo aggiornato l'accesso</div>
        <p className="text-[.85rem] text-ink-2 mt-2 max-w-[340px]">
          Il PIN non è più usato. Ora si accede con email e password (o Google).
          Registrati di nuovo, poi rientra nella tua casa con il codice invito:
          troverai già il tuo nome in lista, basterà selezionarlo.
        </p>
      </div>

      <button
        onClick={onContinue}
        className="w-full max-w-[320px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors flex items-center justify-center gap-1.5"
      >
        Continua <ArrowRight size={18} />
      </button>
    </div>
  );
}
