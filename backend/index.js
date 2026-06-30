import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import weeksRouter from './routes/weeks.js';
import absencesRouter from './routes/absences.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/weeks',    weeksRouter);
app.use('/api/absences', absencesRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
