const ALARM_NAME = 'auto-reload';

// Fired when the scheduled alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  const data = await chrome.storage.local.get(['tabId', 'isActive', 'loop']);

  if (!data.isActive) return;

  // Attempt to reload the stored tab
  if (data.tabId != null) {
    try {
      await chrome.tabs.reload(data.tabId);
    } catch {
      // Tab was closed – deactivate the reloader
      await chrome.storage.local.set({ isActive: false, nextReloadAt: null });
      return;
    }
  }

  // If loop mode is on, schedule the next random reload
  if (data.loop) {
    await scheduleNextReload();
  } else {
    await chrome.storage.local.set({ isActive: false, nextReloadAt: null });
  }
});

// Schedule a one-shot alarm at a random delay between 0 and 5 minutes
async function scheduleNextReload() {
  const delayMinutes = Math.random() * 5; // 0–5 minutes
  const nextReloadAt = Date.now() + delayMinutes * 60 * 1000;
  await chrome.storage.local.set({ nextReloadAt });
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: delayMinutes });
}
