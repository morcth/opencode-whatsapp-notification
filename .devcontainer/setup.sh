#!/usr/bin/env bash
set -euo pipefail

DEV_USER=node
DEV_HOME="/home/$DEV_USER"

# --- Create required dirs (parents for mounts + XDG dirs + opencode volume path) ---
mkdir -p \
  "$DEV_HOME/.config" \
  "$DEV_HOME/.local/share/opencode" \
  "$DEV_HOME/.local/state" \
  "$DEV_HOME/.cache" \
  "$DEV_HOME/.opencode"

# --- Ownership: only what must be writable ---
# Avoid recursive chown of ~/.local/share/opencode because auth.json is a read-only bind mount.
chown -R "$DEV_USER:$DEV_USER" \
  "$DEV_HOME/.config" \
  "$DEV_HOME/.local/state" \
  "$DEV_HOME/.cache" \
  "$DEV_HOME/.opencode" || true

# It's safe to chown these directories themselves (non-recursive), even if they contain a read-only file.
chown "$DEV_USER:$DEV_USER" "$DEV_HOME/.local/share" "$DEV_HOME/.local/share/opencode" || true

# --- Install OpenCode as node (into /home/node/.opencode/bin) ---
sudo -u "$DEV_USER" bash -lc '
  set -euo pipefail
  export PATH="$HOME/.opencode/bin:$HOME/.local/bin:$PATH"

  if [ ! -x "$HOME/.opencode/bin/opencode" ]; then
    echo "Installing OpenCode..."
    curl -fsSL https://opencode.ai/install | bash
  else
    echo "OpenCode already installed."
  fi
'

echo "Devcontainer setup complete."
