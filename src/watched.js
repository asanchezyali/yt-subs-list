// Lets the user mark subscription videos as watched. Marked videos are hidden from the feed
// (see content.css) and listed in a side panel, where they can be reopened or unmarked.
// Plain script: content.js calls syncWatched() whenever the route or the settings change.

const WATCHED_KEY = 'watchedVideos';
const FEED_ITEM_SELECTOR = 'ytd-browse[page-subtype="subscriptions"] ytd-rich-item-renderer';
const SVG_NS = 'http://www.w3.org/2000/svg';
const CHECK_PATH = 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z';

// videoId -> { id, title, channel, markedAt }
let watchedVideos = {};
let panelOpen = false;
let decorateQueued = false;
let panelElements = null;

chrome.storage.local.get({ [WATCHED_KEY]: {} }, (stored) => {
  watchedVideos = stored[WATCHED_KEY];
  refreshWatched();
});

// Keeps several YouTube tabs in sync.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !(WATCHED_KEY in changes)) return;
  watchedVideos = changes[WATCHED_KEY].newValue ?? {};
  refreshWatched();
});

function isOnSubscriptions() {
  return document.documentElement.classList.contains('ysl-on-subs');
}

function videoIdOf(item) {
  const href = item.querySelector('a[href*="/watch?v="]')?.getAttribute('href');
  return href ? new URL(href, location.origin).searchParams.get('v') : null;
}

function describeVideo(item, id) {
  return {
    id,
    title: item.querySelector('.ytLockupMetadataViewModelTitle')?.textContent.trim() || id,
    channel: item.querySelector('.ytContentMetadataViewModelMetadataText')?.textContent.trim() || '',
    markedAt: Date.now(),
  };
}

function saveWatched() {
  chrome.storage.local.set({ [WATCHED_KEY]: watchedVideos });
  refreshWatched();
}

function toggleWatched(item) {
  const id = videoIdOf(item);
  if (!id) return;
  if (watchedVideos[id]) delete watchedVideos[id];
  else watchedVideos[id] = describeVideo(item, id);
  saveWatched();
}

function unmarkWatched(id) {
  delete watchedVideos[id];
  saveWatched();
}

function checkIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', CHECK_PATH);
  svg.append(path);
  return svg;
}

function createMarkButton(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ysl-mark';
  button.append(checkIcon());
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWatched(item);
  });
  return button;
}

// YouTube reuses and re-renders feed items, so every pass re-reads the video id
// and re-adds the button if a re-render removed it.
function decorateFeed() {
  decorateQueued = false;
  if (!isOnSubscriptions()) return;

  for (const item of document.querySelectorAll(FEED_ITEM_SELECTOR)) {
    const id = videoIdOf(item);
    const isWatched = Boolean(id && watchedVideos[id]);
    item.classList.toggle('ysl-watched', isWatched);

    let button = item.querySelector('.ysl-mark');
    if (!button) {
      const menu = item.querySelector('.ytLockupMetadataViewModelMenuButton');
      if (!menu) continue;
      button = createMarkButton(item);
      menu.before(button);
    }
    button.setAttribute('aria-pressed', String(isWatched));
    button.title = isWatched ? 'Unmark as watched' : 'Mark as watched';
  }
}

function queueDecorate() {
  if (decorateQueued) return;
  decorateQueued = true;
  requestAnimationFrame(decorateFeed);
}

new MutationObserver(() => {
  if (isOnSubscriptions()) queueDecorate();
}).observe(document.documentElement, { childList: true, subtree: true });

// --- Panel -------------------------------------------------------------

function createPanel() {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'ysl-panel-toggle';
  toggle.addEventListener('click', () => setPanelOpen(!panelOpen));

  const panel = document.createElement('aside');
  panel.className = 'ysl-panel';
  panel.setAttribute('aria-label', 'Watched videos');

  const header = document.createElement('header');
  const heading = document.createElement('h2');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'ysl-panel-close';
  close.textContent = '×';
  close.title = 'Close';
  close.addEventListener('click', () => setPanelOpen(false));
  header.append(heading, close);

  const list = document.createElement('ol');
  const empty = document.createElement('p');
  empty.className = 'ysl-panel-empty';
  empty.textContent = 'Nothing marked yet. Use the check button on a video to hide it here.';

  panel.append(header, list, empty);
  document.body.append(toggle, panel);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panelOpen) setPanelOpen(false);
  });

  return { toggle, panel, heading, list, empty };
}

function setPanelOpen(open) {
  panelOpen = open;
  renderPanel();
}

function renderEntry(video) {
  const entry = document.createElement('li');

  const link = document.createElement('a');
  link.href = `/watch?v=${encodeURIComponent(video.id)}`;
  link.addEventListener('click', () => setPanelOpen(false));

  const thumbnail = document.createElement('img');
  thumbnail.src = `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/mqdefault.jpg`;
  thumbnail.alt = '';
  thumbnail.loading = 'lazy';

  const text = document.createElement('span');
  text.className = 'ysl-entry-text';
  const title = document.createElement('span');
  title.className = 'ysl-entry-title';
  title.textContent = video.title;
  const channel = document.createElement('span');
  channel.className = 'ysl-entry-channel';
  channel.textContent = video.channel;
  text.append(title, channel);
  link.append(thumbnail, text);

  const unmark = document.createElement('button');
  unmark.type = 'button';
  unmark.className = 'ysl-entry-unmark';
  unmark.textContent = 'Unmark';
  unmark.title = 'Show it in the feed again';
  unmark.addEventListener('click', () => unmarkWatched(video.id));

  entry.append(link, unmark);
  return entry;
}

function renderPanel() {
  if (!panelElements) {
    if (!isOnSubscriptions() || !document.body) return;
    panelElements = createPanel();
  }
  const { toggle, panel, heading, list, empty } = panelElements;
  const videos = Object.values(watchedVideos).sort((a, b) => b.markedAt - a.markedAt);

  toggle.textContent = `Watched · ${videos.length}`;
  toggle.setAttribute('aria-expanded', String(panelOpen));
  panel.classList.toggle('ysl-panel-open', panelOpen && isOnSubscriptions());
  heading.textContent = `Watched videos (${videos.length})`;
  empty.hidden = videos.length > 0;

  if (panelOpen) list.replaceChildren(...videos.map(renderEntry));
}

function refreshWatched() {
  decorateFeed();
  renderPanel();
}

// Called by content.js after every route or settings change.
function syncWatched() {
  if (!isOnSubscriptions()) panelOpen = false;
  refreshWatched();
}
