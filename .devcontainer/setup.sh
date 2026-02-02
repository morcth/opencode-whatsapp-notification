#!/usr/bin/env bash
set -euo pipefail

DEV_USER=node
DEV_HOME=/home/$DEV_USER

# --- Ensure required dirs exist ---
mkdir -p "$DEV_HOME/.local/state"
mkdir -p "$DEV_HOME/.local/share/opencode"

# If you're persisting OpenCode via a volume, this path often starts root-owned.
mkdir -p "$DEV_HOME/.opencode"
chown -R "$DEV_USER:$DEV_USER" "$DEV_HOME/.opencode" || true

# --- Fix ownership ONLY where OpenCode needs to write ---
# DO NOT chown -R inside ~/.local/share/opencode because auth.json is a read-only bind mount.
chown "$DEV_USER:$DEV_USER" "$DEV_HOME/.local" || true
chown -R "$DEV_USER:$DEV_USER" "$DEV_HOME/.local/state" || true

# It's safe to chown the directory itself (non-recursive), even if it contains a read-only file.
chown "$DEV_USER:$DEV_USER" "$DEV_HOME/.local/share" || true
chown "$DEV_USER:$DEV_USER" "$DEV_HOME/.local/share/opencode" || true

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

# Ensure repo-local opencode dirs exist (run as node)
sudo -u "$DEV_USER" bash -lc '
  set -euo pipefail

  WS="${WORKSPACE_FOLDER:-}"
  if [ -z "$WS" ]; then
    WS="$(ls -d /workspaces/* 2>/dev/null | head -n 1 || true)"
  fi

  if [ -n "$WS" ] && [ -d "$WS" ]; then
    cd "$WS"
    mkdir -p .opencode/plugin
  fi
' || true

echo "Devcontainer setup complete."
