import webpush from 'web-push';
import { db } from './db.js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function deliver(subs, payload) {
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload)
      );
    } catch (e) {
      if (e.statusCode === 410) {
        await db.deletePushSubscriptionByEndpoint(sub.endpoint);
      } else {
        console.error('Invio push fallito:', sub.endpoint, e.message);
      }
    }
  }));
}

// Invia una notifica push a tutte le subscription della casa (o di un
// singolo utente, se userId e' passato). Le subscription scadute (410)
// vengono rimosse automaticamente.
export async function sendNotification(houseId, payload, userId = null) {
  const subs = (await db.getPushSubscriptions(houseId))
    .filter(s => userId == null || s.userId === userId);
  await deliver(subs, payload);
}

// Come sendNotification, ma esclude le subscription di un utente
// (es. non avvisare chi ha appena segnato la propria assenza).
export async function sendNotificationExcluding(houseId, payload, excludeUserId) {
  const subs = (await db.getPushSubscriptions(houseId))
    .filter(s => s.userId !== excludeUserId);
  await deliver(subs, payload);
}
