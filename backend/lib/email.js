import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || 'noreply@ilcencio.it';

function fmt(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export async function sendReminderEmail({ to, name, roomIcon, roomName, weekStart, weekEnd }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `🧹 Hai ancora il turno aperto — settimana del ${fmt(weekStart)}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fdf5e6;border-radius:16px;">
        <h2 style="color:#7A4C2A;margin-bottom:4px;">🏠 Il Cencio</h2>
        <p style="color:#7A4C2A;margin-top:0;font-size:13px;">Via Risorgimento</p>
        <hr style="border:none;border-top:1px solid #e0d4c0;margin:16px 0;">
        <p>Ciao <strong>${name}</strong> 👋</p>
        <p>La settimana scorsa (${fmt(weekStart)} – ${fmt(weekEnd)}) il tuo turno</p>
        <p style="font-size:1.4rem;text-align:center;background:#fff;border-radius:10px;padding:14px;border:1px solid #e0d4c0;">
          ${roomIcon} <strong>${roomName}</strong>
        </p>
        <p>non risulta ancora completato. Se l'hai fatto, aggiorna l'app! 💪</p>
        <hr style="border:none;border-top:1px solid #e0d4c0;margin:16px 0;">
        <p style="color:#aaa;font-size:11px;text-align:center;">Il Cencio · reminder automatico del lunedì</p>
      </div>
    `,
  });
}
