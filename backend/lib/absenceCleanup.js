import cron from 'node-cron';
import { db } from './db.js';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

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
