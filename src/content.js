// Toggles classes on <html> so content.css only applies on the subscriptions feed.
// YouTube is a single-page app, so the route is re-checked after every in-app navigation.

const SUBSCRIPTIONS_PATH = '/feed/subscriptions';

let settings = { ...DEFAULT_SETTINGS };

function applyClasses() {
  const onSubscriptions = location.pathname === SUBSCRIPTIONS_PATH;
  const root = document.documentElement;
  root.classList.toggle('ysl-list', onSubscriptions && settings.listLayout);
  root.classList.toggle('ysl-hide-shorts', onSubscriptions && settings.hideShorts);
  root.classList.toggle('ysl-hide-watched', onSubscriptions && settings.hideWatched);
  root.classList.toggle('ysl-on-subs', onSubscriptions);
  syncWatched();
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
  settings = stored;
  applyClasses();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key in DEFAULT_SETTINGS) settings[key] = newValue;
  }
  applyClasses();
});

// yt-navigate-start hides the old layout early; yt-navigate-finish covers the final URL.
document.addEventListener('yt-navigate-start', applyClasses);
document.addEventListener('yt-navigate-finish', applyClasses);
window.addEventListener('popstate', applyClasses);
applyClasses();
