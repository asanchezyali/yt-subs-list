#!/usr/bin/env bash
# Renders icons/icon.svg into the PNG sizes the manifest needs.
# Requires ImageMagick 7 (`magick`).
set -euo pipefail

cd "$(dirname "$0")/../icons"
for size in 16 32 48 128; do
  magick -background none -density 384 icon.svg -resize "${size}x${size}" "icon-$size.png"
done
