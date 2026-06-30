export function WelcomeScreen({ onJoin, onCreate }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 gap-5">
      <div className="text-center mb-4">
        <div className="font-serif text-[2.2rem] text-brown leading-tight">🏠 Turni di Casa</div>
        <p className="text-[.88rem] text-ink-2 mt-2">Gestisci i turni con i tuoi coinquilini</p>
      </div>

      <button
        onClick={onJoin}
        className="w-full max-w-[320px] bg-brown text-white font-bold text-[1rem] rounded-2xl py-4 border-0 cursor-pointer hover:bg-brown-mid transition-colors shadow-[0_4px_16px_rgba(46,26,14,.25)]"
      >
        Ho un codice invito
      </button>

      <button
        onClick={onCreate}
        className="w-full max-w-[320px] bg-cream-2 text-brown font-bold text-[1rem] rounded-2xl py-4 border border-border cursor-pointer hover:bg-[#ece4d6] transition-colors"
      >
        Crea una nuova casa
      </button>

      <p className="text-[.72rem] text-ink-2 text-center max-w-[280px]">
        Se sei già registrato, usa il codice invito che hai ricevuto.<br />
        Altrimenti crea una nuova casa e invita i tuoi coinquilini.
      </p>
    </div>
  );
}
