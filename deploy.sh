#!/usr/bin/env bash
set -euo pipefail

# -------- CONFIG --------
USER="pi"
HOST="nickesselman.nl"
SSH_TARGET="${USER}@${HOST}"

REMOTE_DIR="/srv/blog"        # app root
DATA_DIR="/srv/blog/data"     # persistent JSONs
PM2_NAME="blog"
BUILD_DIR="build"
ECOS_FILE="ecosystem.config.js"  # optional

# -------- BUILD LOCALLY --------
echo "==> Building locally"
npm ci
npm run build

# -------- PREP REMOTE --------
echo "==> Ensuring remote folders"
ssh "$SSH_TARGET" "mkdir -p '${REMOTE_DIR}/${BUILD_DIR}' '${DATA_DIR}'"

# -------- RSYNC (DON'T TOUCH reactions.json) --------
echo "==> Syncing build & data (without reactions.json)"
rsync -az --delete "./${BUILD_DIR}/"  "${SSH_TARGET}:${REMOTE_DIR}/${BUILD_DIR}/"
rsync -az --exclude 'reactions.json' ./data/ "${SSH_TARGET}:${DATA_DIR}/"
rsync -az package.json package-lock.json "${SSH_TARGET}:${REMOTE_DIR}/"
if [[ -f "${ECOS_FILE}" ]]; then
  rsync -az "${ECOS_FILE}" "${SSH_TARGET}:${REMOTE_DIR}/"
fi

# -------- REMOTE INSTALL & PM2 RELOAD --------
echo "==> Installing prod deps & restarting PM2"
ssh "$SSH_TARGET" "bash -lc '
set -euo pipefail
REMOTE_DIR=\"${REMOTE_DIR}\"
DATA_DIR=\"${DATA_DIR}\"
PM2_NAME=\"${PM2_NAME}\"

# load nvm if present (harmless otherwise)
export NVM_DIR=\"\$HOME/.nvm\"
[ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"

# ensure reactions.json exists
if [ ! -f \"\$DATA_DIR/reactions.json\" ]; then
  echo \"{\\\"rows\\\":[]}\" > \"\$DATA_DIR/reactions.json\"
fi

# backup safely (no unbound vars)
if [ -f \"\$DATA_DIR/reactions.json\" ]; then
  cp \"\$DATA_DIR/reactions.json\" \"\$DATA_DIR/reactions.\$(date +%F-%H%M%S).bak\"
fi

cd \"\$REMOTE_DIR\"
npm ci --omit=dev

if pm2 describe \"\$PM2_NAME\" >/dev/null 2>&1; then
  pm2 reload \"\$PM2_NAME\" --update-env
else
  if [ -f ecosystem.config.js ]; then
    pm2 startOrReload ecosystem.config.js --only \"\$PM2_NAME\" --update-env
  else
    REACTIONS_FILE=\"\$DATA_DIR/reactions.json\" pm2 start build/index.js --name \"\$PM2_NAME\"
  fi
fi

pm2 save || true
'"

echo "✅ Deploy complete (reactions preserved)"
