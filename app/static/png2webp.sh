#!/usr/bin/env bash
set -euo pipefail

QUALITY=${1:-80}

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp not found. Install with: sudo pacman -S libwebp" >&2
  exit 1
fi

export QUALITY

find . -type f -iname '*.png' -print0 |
  while IFS= read -r -d '' infile; do
    outfile="${infile%.*}.webp"
    if [[ -e "$outfile" ]]; then
      echo "Skip (exists): $outfile"
      continue
    fi

    echo "Converting: $infile -> $outfile"
    cwebp -q "$QUALITY" "$infile" -o "$outfile" >/dev/null
  done
