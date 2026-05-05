import express from 'express';
const app = express();
app.get('/api/health', (_req, res) => res.json({ status: 'isolated-test-ok' }));
export default app;
