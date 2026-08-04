import { useEffect, useState } from 'react';
import { Sparkles, Smartphone } from 'lucide-react';
import { getDeferredPrompt, onDeferredPrompt, promptInstall } from '../lib/installPrompt.js';
import { isIOS } from '../lib/platform.js';

export function InstallGate() {
  const [canPromptInstall, setCanPromptInstall] = useState(!!getDeferredPrompt());
  const [installing, setInstalling] = useState(false);
  const ios = isIOS();

  useEffect(() => onDeferredPrompt(() => setCanPromptInstall(true)), []);

  async function handleInstall() {
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
      setCanPromptInstall(!!getDeferredPrompt());
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="w-full max-w-[380px] bg-card rounded-2xl border border-border p-6 text-center flex flex-col gap-4">
        <div className="flex justify-center text-brown"><Sparkles size={44} /></div>
        <div className="font-serif text-[1.6rem] text-ink leading-tight">Installa Il Cencio</div>
        <p className="text-[.85rem] text-ink-2">
          Per usare l'app devi prima installarla sulla schermata Home del tuo dispositivo.
        </p>

        {canPromptInstall ? (
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full bg-brown text-ink font-bold text-[.95rem] rounded-2xl py-3.5 border-0 cursor-pointer hover:bg-brown-mid transition-colors shadow-[0_4px_16px_rgba(46,26,14,.25)] disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {installing ? 'Installazione…' : <><Smartphone size={18} /> Installa l'app</>}
          </button>
        ) : ios ? (
          <ol className="text-left text-[.83rem] text-ink-2 flex flex-col gap-2 pl-1">
            <li>1. Tocca l'icona <strong className="text-ink">Condividi</strong> (il quadrato con la freccia) nella barra di Safari</li>
            <li>2. Scorri e tocca <strong className="text-ink">"Aggiungi a Home"</strong></li>
            <li>3. Tocca <strong className="text-ink">"Aggiungi"</strong> in alto a destra</li>
            <li>4. Apri l'app dalla nuova icona in Home</li>
          </ol>
        ) : (
          <p className="text-[.83rem] text-ink-2">
            Apri il menu del browser (⋮) e cerca "Installa app" o "Aggiungi a schermata Home", poi apri l'app dall'icona creata.
          </p>
        )}

        <p className="text-[.72rem] text-ink-2/70">
          Dopo l'installazione, apri l'app dall'icona sulla Home invece che dal browser.
        </p>
      </div>
    </div>
  );
}
