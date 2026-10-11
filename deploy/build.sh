#!/usr/bin/env sh
# Builds the production image. `next build` prerenders pages from Postgres, so the
# build runs on the host network and reads .env.production as a build secret
# (it is not stored in the image).
set -eu
cd "$(dirname "$0")/.."
[ -f .env.production ] || { echo ".env.production not found (copy .env.production.example)" >&2; exit 1; }
docker build --network host \
  --secret id=env,src=.env.production \
  --target runner \
  -t rate-freak-cms:latest \
  "$@" .
