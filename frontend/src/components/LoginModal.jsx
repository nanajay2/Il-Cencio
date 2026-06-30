import { PEOPLE, PEOPLE_EMAILS } from '../constants.js';

export function LoginModal({ onLogin }) {
  return (
    <div className="fixed inset-0 bg-[rgba(10,5,2,.72)] backdrop-blur-md z-[400] flex items-end justify-center">
      <div className="bg-card rounded-t-3xl w-full max-w-[480px] px-6 pt-7 pb-11 shadow-[0_-8px_40px_rgba(0,0,0,.25)] [animation:slideUp_.35s_cubic-bezier(.34,1.56,.64,1)]">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
        <h2 className="font-serif text-[1.3rem] text-ink mb-1">Chi sei? 🏠</h2>
        <p className="text-[.82rem] text-ink-2 mb-5">Tocca il tuo nome per accedere</p>
        <div className="grid grid-cols-2 gap-2.5">
          {PEOPLE.map(name => (
            <button
              key={name}
              onClick={() => onLogin(name)}
              className="p-[14px_12px] border-[1.5px] border-border rounded-2xl bg-cream cursor-pointer font-sans text-left transition-all flex flex-col gap-[3px] hover:border-brown hover:bg-cream-2 hover:scale-[1.02] active:scale-[.98]"
            >
              <span className="text-[.95rem] font-extrabold text-ink">{name}</span>
              <span className="text-[.65rem] text-ink-2">{PEOPLE_EMAILS[name]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
