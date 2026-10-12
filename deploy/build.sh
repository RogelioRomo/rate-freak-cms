#!/usr/bin/env sh
# Builds the production image. `next build` prerenders pages from Postgres, so the
# build runs on the host network and reads .env.production as a build secret
# (it is not stored in the image).
set -eu
cd "$(dirname "$0")/.."
[ -f .env.production ] || { echo ".env.production not found (copy .env.production.example)" >&2; exit 1; }
# The build connects to Postgres, so make sure the db container is up and healthy first.
docker compose -f docker-compose.prod.yml up -d --wait db
docker build --network host \
  --secret id=env,src=.env.production \
  --target runner \
  -t rate-freak-cms:latest \
  "$@" .
