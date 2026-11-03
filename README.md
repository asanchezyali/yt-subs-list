# Subs List for YouTube

A Chrome and Brave extension that turns the YouTube subscriptions feed
(`youtube.com/feed/subscriptions`) into a vertical list, one video per row, and hides Shorts there.
Other YouTube pages are left alone.

## Install (unpacked)

1. Open `chrome://extensions` (or `brave://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this folder.

Both options can be switched off from the toolbar popup.

## How it works

`src/content.js` adds the `ysl-list` and `ysl-hide-shorts` classes to `<html>` only while the current
route is the subscriptions feed (YouTube is a single-page app, so it re-checks on every
`yt-navigate-finish`). `src/content.css` does the rest with CSS: no DOM rewriting, so infinite scroll
keeps working.

YouTube changes its markup often. If the list breaks, the selectors to update are in `src/content.css`.

## Icons

`icons/icon.svg` is the source; run `scripts/make-icons.sh` (ImageMagick 7) to render the PNGs.

## License

MIT
