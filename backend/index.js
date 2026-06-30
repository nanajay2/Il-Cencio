import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import housesRouter   from './routes/houses.js';
import weeksRouter    from './routes/weeks.js';
import absencesRouter from './routes/absences.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/houses',               housesRouter);
app.use('/api/houses/:houseId/weeks',    weeksRouter);
app.use('/api/houses/:houseId/absences', absencesRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
