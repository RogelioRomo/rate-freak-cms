# Rate Freak CMS — Production Deployment Guide

## Prerequisites

- Ubuntu/Debian server with Docker installed
- A domain name pointing to your server's IP (A record)
- An existing PostgreSQL instance accessible from the server
- Nginx installed on the server (`sudo apt install nginx`)

---

## 1. Clone the Repo on Your Server

```bash
git clone <your-repo-url> /opt/rate-freak-cms
cd /opt/rate-freak-cms
```

## 2. Create the Docker Network

```bash
docker network create web
```

## 3. Configure Environment Variables

```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in **all** values. Generate secrets with:

```bash
# For PAYLOAD_SECRET
openssl rand -hex 32

# For CRON_SECRET / PREVIEW_SECRET
openssl rand -hex 16
```

Make sure `NEXT_PUBLIC_SERVER_URL` matches your domain (e.g., `https://ratefreaks.win`).

Make sure `DATABASE_URL` points to your PostgreSQL instance and the database exists:

```bash
# Create the database if it doesn't exist yet
psql -h <host> -U <user> -c "CREATE DATABASE rate_freak;"
```

## 4. Build and Start the App

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Verify it's running:

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

The app will be available at `http://127.0.0.1:3000` on the server.

## 5. Set Up Nginx + SSL

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### Copy and edit the Nginx config

```bash
sudo cp deploy/nginx/rate-freak.conf /etc/nginx/sites-available/rate-freak
sudo ln -s /etc/nginx/sites-available/rate-freak /etc/nginx/sites-enabled/

# Edit the config — replace "yourdomain.com" with your actual domain
sudo nano /etc/nginx/sites-available/rate-freak
```

### Get SSL certificate

```bash
# Temporarily comment out the 443 server block, keep only the port 80 block:
sudo nano /etc/nginx/sites-available/rate-freak

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

# Get the certificate
sudo certbot --nginx -d yourdomain.com

# Certbot will update your nginx config with SSL. Done!
```

Alternatively, if you want to use the full config from the start:

```bash
# Get cert in standalone mode first
sudo certbot certonly --standalone -d yourdomain.com

# Then copy the full nginx config and reload
sudo cp deploy/nginx/rate-freak.conf /etc/nginx/sites-available/rate-freak
# (edit domain name in the file)
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Run Database Migrations

After the first deploy (and after any schema changes):

```bash
docker compose -f docker-compose.prod.yml exec app npx payload migrate
```

## 7. Create Your First Admin User

Visit `https://yourdomain.com/admin` and create the first user through the UI.

---

## Updating the App

```bash
cd /opt/rate-freak-cms
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Useful Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Restart
docker compose -f docker-compose.prod.yml restart app

# Stop
docker compose -f docker-compose.prod.yml down

# Shell into the container
docker compose -f docker-compose.prod.yml exec app sh
```

## SSL Auto-Renewal

Certbot installs a systemd timer by default. Verify:

```bash
sudo systemctl status certbot.timer
```

If not active:

```bash
sudo certbot renew --dry-run
```
