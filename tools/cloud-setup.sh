#!/bin/bash
# Setup script for the Claude Code cloud environment of this repository.
#
# The cloud image ships Node 20, 21 and 22 (22 on PATH), but the Angular CLI
# 22.1 needs Node 22.22.3+ or 24.15+, and CI runs Node 24. This script installs
# the latest Node 24 release to /opt/node24 and links node, npm, npx and
# corepack into /root/.local/bin, which comes first on PATH for Claude Code,
# its Bash tool and the MCP servers it starts.
#
# It is not run from the repository: paste the whole file into the "Setup
# script" field of the cloud environment. It runs as root before Claude Code
# starts, and the result is cached for about seven days. Project dependencies
# (npm ci) are installed by .claude/hooks/session-start.sh instead.
#
# A failure only prints a warning and exits 0, so the session still starts,
# with Node 22.

set -uo pipefail

NODE_DIR=/opt/node24
BIN_DIR=/root/.local/bin
DIST=https://nodejs.org/dist/latest-v24.x

install_node24() {
  local arch tmp file
  case "$(uname -m)" in
    x86_64) arch=x64 ;;
    aarch64 | arm64) arch=arm64 ;;
    *) echo "unsupported architecture $(uname -m)" >&2; return 1 ;;
  esac

  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' RETURN

  curl -fsSL --retry 3 "$DIST/SHASUMS256.txt" -o "$tmp/SHASUMS256.txt" || return 1
  file=$(grep -oE "node-v24\.[0-9]+\.[0-9]+-linux-$arch\.tar\.xz" "$tmp/SHASUMS256.txt" | head -1)
  [ -n "$file" ] || { echo "no Node 24 tarball for linux-$arch" >&2; return 1; }

  curl -fsSL --retry 3 "$DIST/$file" -o "$tmp/$file" || return 1
  (cd "$tmp" && grep " $file\$" SHASUMS256.txt | sha256sum -c --quiet -) || return 1

  rm -rf "$NODE_DIR"
  mkdir -p "$NODE_DIR" "$BIN_DIR"
  tar -xJf "$tmp/$file" -C "$NODE_DIR" --strip-components=1 || return 1
  for tool in node npm npx corepack; do
    ln -sfn "$NODE_DIR/bin/$tool" "$BIN_DIR/$tool"
  done
}

if install_node24; then
  echo "Node $("$NODE_DIR/bin/node" --version) installed to $NODE_DIR, linked into $BIN_DIR"
else
  echo "WARNING: Node 24 could not be installed, sessions keep Node 22" >&2
fi
exit 0
