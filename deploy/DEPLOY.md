# Rate Freak CMS — Production Deployment Guide

Self-hosted on a homelab with Docker. Everything runs from `docker-compose.prod.yml`:

| Service       | What it does                                                                        |
| ------------- | ----------------------------------------------------------------------------------- |
| `db`          | Postgres 16, data in the `pgdata` volume, published on `127.0.0.1:5432` only         |
| `app`         | The Next.js + Payload server (host networking, listens on `127.0.0.1:${APP_PORT}`)  |
| `cloudflared` | Cloudflare Tunnel — publishes the app to the internet without opening router ports |
| `migrate`     | One-off Payload migration runner (`tools` profile, not started by default)          |

Media is stored in Cloudinary, so the database is the only state on the server.

There is no nginx/certbot: TLS and the public hostname are handled by Cloudflare, and
`/admin` is protected by Cloudflare Access (see [Cloudflare Access](#7-cloudflare-access-for-admin)).

---

## Prerequisites

- A Linux server with Docker + the Compose plugin, and `git`
- A domain on Cloudflare (DNS managed by Cloudflare)
- A Cloudflare Zero Trust account (Free plan is enough)

## 1. Clone the Repo

If the repo is private, give the server read-only access with a GitHub **deploy key**:

```bash
ssh-keygen -t ed25519 -C "homelab-deploy" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
# GitHub → repo → Settings → Deploy keys → Add deploy key (leave "Allow write access" off)
ssh -T git@github.com
```

```bash
git clone git@github.com:RogelioRomo/rate-freak-cms.git ~/repos/rate-freak-cms
cd ~/repos/rate-freak-cms
```

## 2. Configure Environment Variables

There are **two** env files, both gitignored:

| File              | Read by                         | Contains                                       |
| ----------------- | ------------------------------- | ---------------------------------------------- |
| `.env.production` | `db`, `app`, `migrate`, build   | Database, Payload, Cloudinary, API keys        |
| `.env`            | Docker Compose (`${...}` vars)  | `TUNNEL_TOKEN`, `APP_PORT` — nothing else      |

They are kept apart so the third-party `cloudflared` container never sees the app's secrets.

```bash
cp .env.production.example .env.production
nano .env.production
```

- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` create the database on first start.
  `DATABASE_URL` must use the same values, with host `127.0.0.1:5432`.
- `NEXT_PUBLIC_SERVER_URL` is the public `https://` URL, no trailing slash. It is baked into the
  client bundle at **build time** — rebuild after changing it.
- When migrating from another server, reuse its `PAYLOAD_SECRET` so existing logins keep working.

Generate secrets with `openssl rand -hex 32` (or `-hex 24` for the DB password).

The `.env` file is created in step 5.

## 3. Start Postgres and Restore Data

```bash
docker compose -f docker-compose.prod.yml up -d --wait db
```

For a brand-new install with no data, skip to step 4 — see [Database Migrations](#database-migrations).

To bring over an existing database, see [Migrating Data from Another Server](#migrating-data-from-another-server).

## 4. Build the App

```bash
./deploy/build.sh
```

`next build` prerenders pages straight from Postgres, so the build has to reach the database.
`deploy/build.sh` starts `db` if needed, builds on the host network, and passes `.env.production`
in as a build secret (it is not stored in the image). Docker Compose can't grant a build host
networking, which is why the app image isn't built with `docker compose build`.

## 5. Cloudflare Tunnel

1. Cloudflare dashboard → **Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared**.
2. Name it, pick **Docker** as the environment, and copy only the token (the string after
   `--token`). Don't run the `docker run` command it shows — compose runs `cloudflared` for you.
3. On the server, create `.env`:

   ```bash
   echo "TUNNEL_TOKEN=<token>" > .env
   # If port 3000 is already used by something else on the host:
   echo "APP_PORT=3010" >> .env
   docker compose -f docker-compose.prod.yml config | grep -E 'TUNNEL_TOKEN|PORT'   # sanity check
   ```

4. Start the tunnel so the dashboard can see it connect:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --no-deps cloudflared
   ```

5. Once the tunnel shows **Healthy**, add a route → **Published application**:
   - Hostname: your domain (or a test subdomain like `new.<domain>`)
   - Service: `HTTP` → `localhost:<APP_PORT>` (default `localhost:3000`)

   Cloudflare creates the DNS record itself. If a record already exists for that hostname
   (e.g. an `A` record to an old server), delete it first.

## 6. Start Everything

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps        # db healthy, app + cloudflared running
curl -I http://127.0.0.1:<APP_PORT>                 # expect HTTP 200
```

Then open `https://<your-domain>` and `https://<your-domain>/admin`.

For a fresh install, `/admin` asks you to create the first admin user.

## 7. Cloudflare Access for `/admin`

All users — admins and regular reviewers — log in through `/admin/login`, so Access gates the
login for everyone. Only allow-listed emails can get past it.

1. **Identity provider:** Zero Trust → **Integrations → Identity providers → Add → One-time PIN**.
2. **Policy:** **Access controls → Policies → Add a policy**
   - Name `Ratefreak users`, Action `Allow`, session duration e.g. `24 hours`
   - Include → `Emails` → every user's email address
3. **Application:** **Access controls → Applications → Add an application → Self-hosted and private**
   - Public hostnames: `<domain>` with path `admin`, and `<domain>` with path `api/users/login`
     (the login form posts to the API, so both need covering)
   - Policy: select `Ratefreak users`
   - Authentication: turn off "Accept all available identity providers", select **One-time PIN**,
     turn on **Apply instant authentication**
4. Test in an incognito window: the public site loads normally, `/admin` asks for an email first.

**New users** must be created in Payload *and* added to the `Ratefreak users` policy.

---

## Migrating Data from Another Server

On the **old** server (Postgres running in Docker there):

```bash
docker exec <pg-container> env | grep POSTGRES_            # user / db name
docker exec <pg-container> postgres --version              # new server must be same major or newer
docker exec <pg-container> pg_dump -U <user> -d <db> -Fc > ratefreak.dump
```

Copy it to the new server — run `scp` on the machine that **has** the file:

```bash
scp ratefreak.dump <user>@<new-server>:~/backups/
```

On the **new** server, with `db` running and empty:

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_restore -U <POSTGRES_USER> -d <POSTGRES_DB> --no-owner --no-acl < ~/backups/ratefreak.dump

docker compose -f docker-compose.prod.yml exec db psql -U <POSTGRES_USER> -d <POSTGRES_DB> \
  -c "select count(*) from users;" -c "select count(*) from reviews;"   # compare with the old server
```

To restore again (e.g. a final sync), wipe the volume first. **This deletes all data in `db`:**

```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d --wait db
# ...then pg_restore as above
```

### Cutover Checklist

1. Stop the app on the old server, take a fresh dump, and restore it (as above).
2. Set `NEXT_PUBLIC_SERVER_URL` to the real domain, then `./deploy/build.sh` and `up -d`.
3. Cloudflare DNS: delete the old `A` record pointing at the old server.
4. Tunnel route: change the hostname from the test subdomain to the real domain.
5. Access application: change **both** hostnames (`admin`, `api/users/login`) to the real domain.
6. Keep the old server around for a few days in case you need to roll back.

---

## Database Migrations

Payload only auto-syncs the schema in development. In production, schema changes need migrations.
The runtime image is a minimal standalone build without the Payload CLI, so migrations run in a
separate one-off container:

```bash
docker compose -f docker-compose.prod.yml run --rm --build migrate
```

> `src/migrations/` is currently gitignored, so a fresh clone has no migrations to run.
> Commit them if you want to apply schema changes this way.

## Updating the App

```bash
cd ~/repos/rate-freak-cms
git pull
./deploy/build.sh
docker compose -f docker-compose.prod.yml up -d
```

Keep dependencies up to date — unpatched Next.js / React / Payload vulnerabilities are the main
real-world risk for a public site. Pull newer base images occasionally too:

```bash
docker compose -f docker-compose.prod.yml pull db cloudflared
docker compose -f docker-compose.prod.yml up -d
```

## Backups

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U <POSTGRES_USER> -d <POSTGRES_DB> -Fc > ~/backups/ratefreak-$(date +%F).dump
```

## Useful Commands

```bash
docker compose -f docker-compose.prod.yml logs -f app           # app logs
docker compose -f docker-compose.prod.yml logs -f cloudflared   # tunnel logs
docker compose -f docker-compose.prod.yml restart app
docker compose -f docker-compose.prod.yml down                  # stop (keeps data)
docker compose -f docker-compose.prod.yml exec app sh           # shell into the app
docker compose -f docker-compose.prod.yml exec db psql -U <POSTGRES_USER> -d <POSTGRES_DB>
```

## Troubleshooting

| Symptom                                          | Cause / fix                                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Build fails with `ECONNREFUSED 127.0.0.1:5432`  | `db` isn't running or `DATABASE_URL` is wrong. `build.sh` starts `db`; check `ps` and the URL. |
| `address already in use` on 5432 / app port      | Something else on the host uses that port. Set `APP_PORT` in `.env` (and update the tunnel).  |
| Browser shows another app's page / odd errors    | The tunnel route points at a port another service uses. Check `sudo ss -ltnp \| grep :<port>`. |
| Cloudflare error 502 / 1033                      | Tunnel is up but the app isn't answering — check `logs app` and the route's port.             |
| `cloudflared` logs `Unauthorized`                | `TUNNEL_TOKEN` missing from `.env` — check with `config \| grep TUNNEL_TOKEN`.                 |
| Logins / admin requests fail                     | `NEXT_PUBLIC_SERVER_URL` doesn't match the public URL — fix it and rebuild.                   |
