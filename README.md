# StaffWatch — Staff Monitoring Platform
**Built by Enovtec** | Multi-tenant SaaS | No login required on PC

---

## Architecture

```
staffwatch/
├── agent/          ← Python agent (runs on each PC)
├── backend/        ← Node.js API (your server)
└── dashboard/      ← React frontend
```

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set JWT_SECRET and your email

npm install
node src/db/migrate.js     # creates SQLite DB
node src/db/seed.js        # creates superadmin + demo org
npm start                  # runs on port 3001
```

### 2. Dashboard

```bash
cd dashboard
npm install
npm start     # dev server on port 3000, proxies to 3001
```

### 3. Agent (on a PC)

```bash
cd agent
pip install -r requirements.txt

# Create config.json first
python agent.py --setup
# Enter server URL and machine token (from dashboard → Machines → Add Machine)

# Run directly (for testing):
python agent.py

# Install as Windows service:
python service.py install
python service.py start
```

---

## Adding a new client (e.g. Peter's care home)

1. Log in as superadmin → **Organisations** → **New Organisation**
2. Fill in: org name, plan, seat limit, admin email + password
3. Send Peter his login URL + credentials
4. Peter logs in → goes to **Machines** → **Add Machine** → gets a token
5. Peter (or you) downloads agent, runs setup with that token
6. Machine appears in Peter's dashboard automatically

---

## Deployment (production)

### Server (Ubuntu/VPS)

```bash
# Install Node
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone and set up
cd /var/www/staffwatch/backend
npm install
cp .env.example .env     # edit with real values
node src/db/migrate.js
node src/db/seed.js

# PM2 to keep it running
npm install -g pm2
pm2 start src/server.js --name staffwatch-api
pm2 save
pm2 startup

# Build and serve dashboard
cd /var/www/staffwatch/dashboard
npm install
npm run build
# Serve build/ via nginx
```

### Nginx config

```nginx
server {
    listen 443 ssl;
    server_name staffwatch.yourdomain.com;

    # Serve React dashboard
    location / {
        root /var/www/staffwatch/dashboard/build;
        try_files $uri /index.html;
    }

    # Proxy API to Node
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Serve screenshots (Node handles auth, but nginx can cache)
    client_max_body_size 20M;
}
```

---

## Building the Windows .exe installer

```bash
cd agent
pip install pyinstaller pillow requests psutil pywin32

# Build
pyinstaller staffwatch-agent.spec

# Output: dist/StaffWatchAgent.exe
# Distribute this + a config.json with the machine_token baked in
```

To generate per-client installers, script it:
```bash
# Generate config, build exe, zip it
TOKEN="uuid-from-dashboard"
echo '{"server_url":"https://staffwatch.yourdomain.com","machine_token":"'$TOKEN'"}' > config.json
pyinstaller staffwatch-agent.spec --distpath dist/$TOKEN
```

---

## Pricing tiers (suggested)

| Plan       | Machines | Price/mo |
|------------|----------|----------|
| Starter    | 5        | £29      |
| Growth     | 15       | £59      |
| Pro        | 30       | £99      |
| Enterprise | Unlimited| Custom   |

Peter's care home: likely Starter (£29/mo). Pure profit after hosting costs.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Agent | Python 3.10+, Pillow, psutil, PyInstaller |
| API | Node.js, Express, better-sqlite3, JWT |
| Frontend | React 18, Recharts, React Router |
| DB | SQLite (swap to Postgres for scale) |
| Storage | Local disk (swap to S3/Wasabi for scale) |

---

## Extending this

- **Email alerts**: Nodemailer when machine goes offline >10 mins
- **Billing**: Stripe subscription per org, webhook to toggle active
- **Super dashboard integration**: Pass JWT from your main dashboard; StaffWatch validates against shared secret
- **Mobile app**: React Native; same API
- **More agents**: macOS (same Python code works), Linux (xdotool)
