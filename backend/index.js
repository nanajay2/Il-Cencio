import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import housesRouter   from './routes/houses.js';
import weeksRouter    from './routes/weeks.js';
import absencesRouter from './routes/absences.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rotta globale join (non conosce houseId a priori)
app.post('/api/join', async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: 'inviteCode richiesto' });
  try {
    const { claimUserSlot } = await import('./lib/db.js');
    res.json(await claimUserSlot(inviteCode));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.use('/api/houses',                          housesRouter);
app.use('/api/houses/:houseId/weeks',           weeksRouter);
app.use('/api/houses/:houseId/absences',        absencesRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
