import { ArrowLeft } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

// Pagina di dettaglio aperta da Casa: copre la bottom bar e ha il suo "indietro".
export function SubPage({ title, onBack, children }) {
  useBodyScrollLock();
  return (
    <div className="fixed inset-0 bg-page z-[300] overflow-y-auto">
      <div
        className="max-w-[480px] mx-auto px-5 flex flex-col gap-4"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)',
        }}
      >
        <div className="flex items-center gap-2 -ml-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Indietro"
            className="w-11 h-11 rounded-full border-0 bg-transparent text-ink cursor-pointer flex items-center justify-center hover:bg-soft transition-colors flex-shrink-0"
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
          <h1 className="font-display font-extrabold text-[1.625rem] leading-tight tracking-[-.02em] text-ink truncate">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
