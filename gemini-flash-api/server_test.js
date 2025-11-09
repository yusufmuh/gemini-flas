import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('ok'));
const PORT = 3001;
app.listen(PORT, () => console.log(`Test server ready on http://localhost:${PORT}`));
