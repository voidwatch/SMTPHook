const { simpleParser } = require('mailparser');
const axios = require('axios');
const dotenv = require('dotenv');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

dotenv.config();

const LOG_FILE = '/app/logs/haraka.log';
const log = (msg) => {
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
};

exports.register = function () {
  this.register_hook('data_post', 'forward_to_parser');
};

exports.forward_to_parser = function (next, connection) {
  const emailBuffer = connection.transaction.data_lines.join('\n');
  simpleParser(Readable.from([emailBuffer])).then(parsed => {
    // Filter only allowed domains
    if (!parsed.to || !parsed.to.text.includes("yourdomain.com")) {
      log(`Denied: recipient outside allowed domain -> ${parsed.to?.text}`);
      return next(DENY, "Domain not allowed");
    }

    // Dynamic routing
    let webhook = process.env.WEBHOOK_URL;
    const recipient = parsed.to.text.toLowerCase();
    if (recipient.includes("support@")) {
      webhook = "http://webhook:4000/support";
    } else if (recipient.includes("alerts@")) {
      webhook = "http://webhook:4000/alerts";
    }

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

    axios.post(webhook, jsonPayload)
      .then(() => {
        log(`Forwarded to ${webhook}: ${parsed.subject}`);
        next();
      })
      .catch(err => {
        log(`Error forwarding: ${err.message}`);
        next(DENYSOFT, 'Could not forward email to parser');
      });
  }).catch(err => {
    log(`Parse error: ${err.message}`);
    next(DENY, 'Could not parse email');
  });
};
