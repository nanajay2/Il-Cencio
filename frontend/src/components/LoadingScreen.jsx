import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, LogOut } from 'lucide-react';

// Attesa a tutto schermo: controllo della sessione e caricamento delle case.
// Se il caricamento fallisce mostra l'errore e "Riprova", invece di lasciare
// uno spinner infinito.
export function LoadingScreen({ error, onRetry, onLogout }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (error) return;
    const t = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(t);
  }, [error]);

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-6 gap-4 text-center">
      <img src="/icon-192.png" alt="" width={96} height={96} className="rounded-[22px]" />
      <div className="font-display font-extrabold text-[2.4rem] text-ink leading-tight">Il Cencio</div>

      {error ? (
        <>
          <p role="alert" className="text-[.875rem] text-ink max-w-[300px]">Non riesco a caricare le tue case: {error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="w-full max-w-[320px] h-[52px] bg-primary text-white font-bold text-[1rem] rounded-2xl border-0 cursor-pointer hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} aria-hidden="true" /> Riprova
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-11 px-3 text-[.8125rem] text-ink-2 border-0 bg-transparent cursor-pointer flex items-center gap-1"
          >
            <LogOut size={14} aria-hidden="true" /> Esci
          </button>
        </>
      ) : (
        <div role="status" className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" aria-hidden="true" />
          <p className="text-[.875rem] text-ink-2">Un attimo…</p>
          {slow && <p className="text-[.8125rem] text-ink-2 max-w-[260px]">Ci sta mettendo più del solito, ancora qualche secondo.</p>}
        </div>
      )}
    </div>
  );
}
