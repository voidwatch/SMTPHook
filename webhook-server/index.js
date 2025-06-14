const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json({ limit: '50mb' }));

app.post('/incoming', (req, res) => {
  console.log('📨 Incoming parsed email:');
  console.dir(req.body, { depth: null, colors: true });
  res.status(200).send('Received');
});

app.listen(PORT, () => {
  console.log(`✅ Webhook receiver running at http://localhost:${PORT}/incoming`);
});
