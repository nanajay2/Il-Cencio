import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './db.js';
import { sendNotification } from './push.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const META_KEY = 'last_notified_version';

// Al primo avvio non notifica nulla (nessuna versione precedente nota):
// registra solo la versione corrente come baseline. Alle esecuzioni
// successive, se la versione e' cambiata, avvisa tutte le case.
export async function notifyIfNewVersion() {
  const currentVersion = pkg.version;
  const lastNotified = await db.getAppMeta(META_KEY);

  if (lastNotified === null) {
    await db.setAppMeta(META_KEY, currentVersion);
    return;
  }
  if (lastNotified === currentVersion) return;

  const houseIds = await db.getAllHouseIds();
  await Promise.all(houseIds.map(houseId =>
    sendNotification(houseId, {
      title: 'Nuova versione disponibile',
      body: `Il Cencio è stato aggiornato alla versione ${currentVersion}. Ricarica l'app per vedere le novità.`,
      url: '/',
    }).catch(e => console.error(`Notifica nuova versione fallita per casa ${houseId}:`, e.message))
  ));

  await db.setAppMeta(META_KEY, currentVersion);
}
