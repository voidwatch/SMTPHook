const { simpleParser } = require('mailparser');
const dotenv = require('dotenv');
const http = require('http');
const axios = require('axios');
const { Readable } = require('stream');
const fs = require('fs');

dotenv.config();

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const LOG_FILE = '/app/logs/parser.log';

const log = (msg) => {
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', async () => {
      const rawEmail = Buffer.concat(body).toString();
      try {
        const parsed = await simpleParser(Readable.from([rawEmail]));
        const jsonPayload = {
          from: parsed.from?.text,
          to: parsed.to?.text,
          subject: parsed.subject,
          text: parsed.text,
          html: parsed.html,
          attachments: parsed.attachments.map(a => ({
            filename: a.filename,
            contentType: a.contentType,
            content: a.content.toString('base64')
          }))
        };

        await axios.post(WEBHOOK_URL, jsonPayload);
        log(`Email forwarded: ${parsed.subject}`);
        res.writeHead(200);
        res.end('Parsed and forwarded');
      } catch (err) {
        log(`Error: ${err.message}`);
        res.writeHead(500);
        res.end('Error parsing email');
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
  } else {
    res.writeHead(405);
    res.end('Only POST supported');
  }
});

server.listen(3000, () => {
  log('Parser listening on port 3000');
});
