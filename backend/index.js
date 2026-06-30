import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import cron    from 'node-cron';
import housesRouter   from './routes/houses.js';
import weeksRouter    from './routes/weeks.js';
import absencesRouter from './routes/absences.js';
import { sendWeeklyReminders } from './lib/reminder.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/houses',               housesRouter);
app.use('/api/houses/:houseId/weeks',    weeksRouter);
app.use('/api/houses/:houseId/absences', absencesRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

// Ogni lunedì alle 7:00 UTC (≈ 9:00 ora italiana estiva)
cron.schedule('0 7 * * 1', () => {
  console.log('⏰ Cron: weekly reminder');
  sendWeeklyReminders().catch(e => console.error('Reminder error:', e.message));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
