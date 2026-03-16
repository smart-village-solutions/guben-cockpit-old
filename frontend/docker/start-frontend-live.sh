#!/bin/sh
set -eu

wait_for_gateway() {
  gateway_url="${INTERNAL_CONTENT_GATEWAY_URL:-http://content-gateway:5100}"
  echo "Waiting for content gateway at ${gateway_url}/health ..."

  attempts=0
  until wget -qO- "${gateway_url}/health" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 60 ]; then
      echo "Content gateway did not become ready in time."
      exit 1
    fi
    sleep 2
  done
}

wait_for_gateway

npm run translations
npm run check-translations

exec npx vite --host 0.0.0.0 --port 3000
