export const PEOPLE = ['Giada', 'Silvia', 'Giulia', 'Eliana', 'Marco'];
export const CHORES = ['Cucina', 'Bagno 1', 'Bagno 2', 'Corridoio', 'Spazzatura'];
export const BAGNO1 = ['Giada', 'Silvia', 'Eliana'];
export const BAGNO2 = ['Marco', 'Giulia'];

export const PEOPLE_EMAILS = {
  Giada:  'giada.dt02@gmail.com',
  Silvia: 'silvia.saladino90@gmail.com',
  Giulia: 'giuliabracchitta2@gmail.com',
  Marco:  'marcoskype3@gmail.com',
  Eliana: 'ely.maria75@gmail.com',
};

export const ICONS = {
  'Cucina':     '🍳',
  'Bagno 1':   '🚿',
  'Bagno 2':   '🛁',
  'Corridoio':  '🧹',
  'Spazzatura': '🗑️',
};

export const CHORE_COLORS = {
  'Cucina':     '#c97b4b',
  'Bagno 1':   '#5a9e8a',
  'Bagno 2':   '#6a96c4',
  'Corridoio':  '#c9a84c',
  'Spazzatura': '#8c9e8a',
};

export const MONTHS = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
export const DAYS   = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];

export function fmt(s) {
  const [, m, d] = s.split('-');
  return `${+d} ${MONTHS[+m - 1]}`;
}

export function addDays(s, n) {
  const d = new Date(s + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

export const todayStr = () => new Date().toISOString().split('T')[0];
export const isCurW   = w  => todayStr() >= w.start && todayStr() <= w.end;
export const isPastW  = w  => w.end   < todayStr();
export const isFutW   = w  => w.start > todayStr();
export const isEditable = w => w.end >= addDays(todayStr(), -7);
