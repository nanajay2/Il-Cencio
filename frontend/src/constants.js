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

export const todayStr   = () => new Date().toISOString().split('T')[0];
export const isCurW     = w  => todayStr() >= w.start && todayStr() <= w.end;
export const isPastW    = w  => w.end   < todayStr();
export const isFutW     = w  => w.start > todayStr();
export const isEditable = w  => w.end  >= addDays(todayStr(), -7);
