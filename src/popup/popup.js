// Binds each checkbox to the setting with the same id. The content script listens for changes.

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const checkbox = document.getElementById(key);
    checkbox.checked = settings[key];
    checkbox.addEventListener('change', () => {
      chrome.storage.sync.set({ [key]: checkbox.checked });
    });
  }
});
