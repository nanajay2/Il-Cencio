// La scelta "entra in una casa esistente" vs "creane una nuova" avviene
// DOPO l'autenticazione (vedi ChooseHouseScreen): serve comunque
// un'identità Supabase prima di poter fare entrambe le cose.
export function WelcomeScreen({ onStart }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-4">
        <div className="font-serif text-[2.4rem] text-ink leading-tight">Il Cencio</div>
        <p className="text-[.88rem] text-ink-2 mt-2">Turni di pulizia tra coinquilini</p>
      </div>

      <button
        onClick={onStart}
        className="w-full max-w-[320px] bg-brown text-ink font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors shadow-[0_4px_16px_rgba(46,26,14,.25)]"
      >
        Inizia
      </button>

      <span className="text-[.7rem] text-ink-2/60 mt-2">v{__APP_VERSION__}</span>
    </div>
  );
}
