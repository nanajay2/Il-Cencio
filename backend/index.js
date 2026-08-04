import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import housesRouter   from './routes/houses.js';
import weeksRouter    from './routes/weeks.js';
import absencesRouter from './routes/absences.js';
import swapsRouter    from './routes/swaps.js';
import { startReminderCron } from './lib/reminders.js';
import { startAbsenceCleanupCron } from './lib/absenceCleanup.js';
import { notifyIfNewVersion } from './lib/versionNotifier.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/houses',               housesRouter);
app.use('/api/houses/:houseId/weeks',    weeksRouter);
app.use('/api/houses/:houseId/absences', absencesRouter);
app.use('/api/houses/:houseId/swaps',    swapsRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

startReminderCron();
startAbsenceCleanupCron();
notifyIfNewVersion().catch(e => console.error('Controllo nuova versione fallito:', e.message));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
