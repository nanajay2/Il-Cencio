import cron from 'node-cron';
import { db } from './db.js';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Un'assenza si cancella il giorno dopo la sua fine, anche se il turno che la
// contiene dura ancora. Il turno in corso non viene più rigenerato di default,
// quindi non perde nulla; solo con "Ricalcola da ora" a assenza già finita la
// persona torna in lista (caso raro, il modale di conferma avvisa già).
export async function cleanupExpiredAbsences() {
  try {
    const n = await db.deleteExpiredAbsences(todayStr());
    if (n) console.log(`Assenze scadute rimosse: ${n}`);
  } catch (e) {
    console.error('Pulizia assenze scadute fallita:', e.message);
  }
}

export function startAbsenceCleanupCron() {
  cleanupExpiredAbsences();
  cron.schedule('0 9 * * *', cleanupExpiredAbsences);
}
