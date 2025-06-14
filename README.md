# Inbound Parse Service (Open Source SendGrid Inbound Parse Alternative)
![License](https://img.shields.io/github/license/voidwatch/SMTPHook)
![Issues](https://img.shields.io/github/issues/voidwatch/SMTPHook)
![Last Commit](https://img.shields.io/github/last-commit/voidwatch/SMTPHook)
![Stars](https://img.shields.io/github/stars/voidwatch/SMTPHook?style=social)

> A self-hosted, open-source replacement for SendGrid Inbound Parse. Receive SMTP emails, parse them into JSON, and forward to any webhook endpoint. Easy to run with Podman or Docker Compose.


SMTPHook is a fully open-source, containerized solution that replicates the functionality of SendGrid’s Inbound Parse API. It allows you to receive incoming emails via SMTP, parse them into structured JSON, and forward them to a configurable webhook. Ideal for support systems, automation workflows, and serverless email ingestion.

Built with:

Haraka for the SMTP server

Node.js + Mailparser for email parsing

Express webhook receiver

Podman/Docker Compose for orchestration

Systemd integration for auto-start

Log rotation and routing/filtering logic for production use

## Components

### 1. Haraka SMTP Server
- Listens for incoming emails on port `2525`
- Uses a custom plugin to parse and forward emails

### 2. Node.js Parser
- Uses `mailparser` to extract structured data
- Converts raw email to JSON and forwards to a webhook

### 3. Webhook Receiver (for local testing)
- Express server that logs received payloads
- Useful for testing end-to-end flow

## Project Structure

```
inbound-parse-service/
├── .env                        # Environment configuration
├── podman-compose.yml         # Podman Compose file
├── haraka/                    # Haraka SMTP server
│   ├── config/
│   │   ├── smtp.ini
│   │   └── plugins
│   ├── haraka.config.js
│   ├── index.js
│   ├── package.json
│   └── plugins/
│       └── data_post.js
├── parser/                    # Email parser service
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── webhook-server/            # Test webhook receiver
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── README.md
└── systemd/
    └── inbound-parse.service  # Optional systemd unit file
```

## How It Works

1. Email is sent to your SMTP server (Haraka) at port 2525.
2. Haraka captures the full raw message and uses `mailparser` to extract fields.
3. Parsed email is forwarded as JSON to a configurable webhook URL.
4. A test webhook receiver (running on port 4000) prints parsed JSON for debugging.

## Prerequisites

- Podman: [https://podman.io](https://podman.io)
- podman-compose (install via pip):
  ```bash
  pip install podman-compose
  ```

## Environment Configuration (`.env`)

Create a `.env` file in the root of the project:
```bash
cp .env.example .env
```

Example contents:
```env
WEBHOOK_URL=http://webhook:4000/incoming
PARSER_ENDPOINT=http://parser:3000
SMTP_HOST=0.0.0.0
SMTP_PORT=2525
```

## Running the Service

From the project root:

```bash
podman-compose -f podman-compose.yml up --build
```

### Stopping

```bash
podman-compose down
```

### Viewing Logs

```bash
podman logs -f haraka-smtp
podman logs -f email-parser
podman logs -f webhook-server
```

## Testing

You can test email sending with:

```bash
swaks --to test@example.com --server localhost:2525
```

## Real Email (Production)

To receive real emails from the internet:

1. Point your domain's MX record to your server's public IP.
2. Open/forward port 25 from your router/firewall to container port 2525.
3. Optionally use a reverse proxy or Postfix in front of Haraka.

## Auto-start with systemd (Optional)

Create a systemd service:

```ini
[Unit]
Description=Inbound Parse Service (Haraka + Parser + Webhook)
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/inbound-parse-service
ExecStart=/usr/bin/podman-compose up
ExecStop=/usr/bin/podman-compose down
Restart=always
TimeoutStopSec=10

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable --now inbound-parse.service
```

## Webhook Payload Format

```json
{
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "Test Subject",
  "text": "Plaintext version",
  "html": "<p>HTML version</p>",
  "attachments": [
    {
      "filename": "file.txt",
      "contentType": "text/plain",
      "content": "base64encodedcontent"
    }
  ]
}
```

## Notes

- Ensure port `2525` is open in your firewall or forwarded from port 25.
- Haraka listens on `0.0.0.0:2525` so it can receive external mail.
- Webhook endpoint is configurable via `.env`.

## License

MIT

## Logging & Log Rotation

All services write runtime logs to a shared `logs/` directory, which is mounted inside each container at `/app/logs`.

### Log Paths

- `logs/haraka.log` — Logs for SMTP events, parsing, routing, and errors
- `logs/parser.log` — Logs for email parsing, forwarding, and health checks

You can view them manually or tail them in real time:

```bash
tail -f logs/haraka.log
tail -f logs/parser.log
```

### Podman Volume

This is enabled via `podman-compose.yml`:

```yaml
volumes:
  - ./logs:/app/logs
```

### Logrotate Setup

To enable automatic log rotation, copy this config to `/etc/logrotate.d/logrotate-smtphook.conf`:

```conf
/path/to/inbound-parse-service/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    copytruncate
}
```

Make sure to replace `/path/to/inbound-parse-service/logs/` with the actual path to your project.

You can test rotation manually:

```bash
sudo logrotate -f /etc/logrotate.d/logrotate-smtphook.conf
```

This keeps logs small, compressed, and under control on long-running systems.