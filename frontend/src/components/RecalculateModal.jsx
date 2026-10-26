import { CalendarClock } from 'lucide-react';

// Testi per tipo di modifica. `primary` conserva il turno in corso (risolve
// 'next'), `secondary` lo ricalcola (risolve 'now'); con `cancel` la modifica
// si può annullare del tutto (risolve null).
const VARIANTS = {
  next: {
    title: 'Da quando vale la modifica?',
    text: 'Le regole verranno applicate dal turno successivo a quello attuale.',
    primary: 'Ok',
    secondary: 'Ricalcola da ora',
  },
  absence: {
    title: 'Assenza nel turno in corso',
    text: "L'assenza cade nel turno in corso. Puoi lasciare i turni come sono, con il simbolo assenza, oppure ricalcolarli: in quel caso si perdono le spunte e gli scambi già fatti.",
    primary: 'Lascia i turni',
    secondary: 'Ricalcola da ora',
  },
  confirm: {
    title: 'Ricalcolare il turno in corso?',
    text: 'Questa modifica obbliga a ricalcolare anche il turno in corso: si perdono le spunte e gli scambi già fatti.',
    primary: 'Annulla',
    secondary: 'Conferma',
    cancel: true,
  },
};

export function RecalculateModal({ variant, onChoose }) {
  const v = VARIANTS[variant];
  if (!v) return null;

  // In "confirm" il bottone principale annulla, il secondario conferma.
  const onPrimary   = () => onChoose(v.cancel ? null : 'next');
  const onSecondary = () => onChoose('now');

  return (
    <div className="fixed inset-0 bg-[rgba(5,2,0,.6)] backdrop-blur-[4px] z-[600] flex items-center justify-center p-6">
      <div role="dialog" aria-modal="true" className="bg-card rounded-[24px] p-6 max-w-[340px] w-full shadow-[0_20px_60px_rgba(0,0,0,.45)] text-center">
        <div className="flex justify-center text-brown mb-2"><CalendarClock size={32} /></div>
        <div className="font-serif text-[1.35rem] text-brown mb-1">{v.title}</div>
        <p className="text-[.85rem] text-ink-2 mb-5">{v.text}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onPrimary}
            className="w-full bg-brown text-ink font-bold text-[.95rem] rounded-2xl py-3 border-0 cursor-pointer hover:bg-brown-mid transition-colors"
          >
            {v.primary}
          </button>
          <button
            onClick={onSecondary}
            className="w-full bg-transparent text-brown font-bold text-[.9rem] rounded-2xl py-3 border-[1.5px] border-border cursor-pointer hover:border-brown transition-colors"
          >
            {v.secondary}
          </button>
        </div>
      </div>
    </div>
  );
}
