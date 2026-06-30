export function WelcomeScreen({ onJoin, onLogin, onCreate }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center mb-4">
        <div className="font-serif text-[2.4rem] text-brown leading-tight">Il Cencio</div>
        <p className="text-[.88rem] text-ink-2 mt-2">Turni di pulizia · Via Risorgimento</p>
      </div>

      <button
        onClick={onJoin}
        className="w-full max-w-[320px] bg-brown text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors shadow-[0_4px_16px_rgba(46,26,14,.25)]"
      >
        🏠 Unisciti a una casa
      </button>

      <button
        onClick={onLogin}
        className="w-full max-w-[320px] bg-cream-2 text-brown font-bold text-[1rem] rounded-2xl py-4 border border-border cursor-pointer hover:bg-[#ece4d6] transition-colors"
      >
        🔑 Accedi
      </button>

      <button
        onClick={onCreate}
        className="w-full max-w-[320px] bg-transparent text-ink-2 font-semibold text-[.9rem] rounded-2xl py-3 border-0 cursor-pointer hover:text-brown transition-colors"
      >
        + Crea una nuova casa
      </button>

      <p className="text-[.72rem] text-ink-2 text-center max-w-[280px] mt-2">
        "Unisciti" se hai il codice della tua casa.<br />
        "Accedi" se sei già registrata e vuoi entrare da un nuovo dispositivo.
      </p>
    </div>
  );
}
