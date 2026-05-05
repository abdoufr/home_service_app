import express from 'express';
const app = express();
app.get('*', (req, res) => {
  res.json({ message: 'Extremely simple test' });
});
export default app;
