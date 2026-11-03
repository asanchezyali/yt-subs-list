# Subs List for YouTube

A Chrome and Brave extension that turns the YouTube subscriptions feed
(`youtube.com/feed/subscriptions`) into a vertical list, one video per row, and hides Shorts there.
Other YouTube pages are left alone.

Each video also gets a check button. Checking a video off hides it from the feed; the **Watched**
button in the bottom-right corner opens a panel with every checked video, where you can open it again
or unmark it to bring it back to the feed. The list is stored locally in the browser
(`chrome.storage.local`), so it is not synced between devices.

## Install (unpacked)

1. Open `chrome://extensions` (or `brave://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this folder.

All three options can be switched off from the toolbar popup.

## How it works

`src/content.js` adds the `ysl-list` and `ysl-hide-shorts` classes to `<html>` only while the current
route is the subscriptions feed (YouTube is a single-page app, so it re-checks on every
`yt-navigate-finish`). `src/content.css` does the layout with CSS: no DOM rewriting, so infinite scroll
keeps working. `src/watched.js` adds the check buttons and the panel.

YouTube changes its markup often. If the list breaks, the selectors to update are in `src/content.css`.

## Icons

`icons/icon.svg` is the source; run `scripts/make-icons.sh` (ImageMagick 7) to render the PNGs.

## License

MIT
