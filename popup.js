const ALARM_NAME = 'auto-reload';

const dot          = document.getElementById('dot');
const statusText   = document.getElementById('statusText');
const countdown    = document.getElementById('countdown');
const startBtn     = document.getElementById('startBtn');
const stopBtn      = document.getElementById('stopBtn');
const loopCheckbox = document.getElementById('loopCheckbox');

// ── UI refresh ────────────────────────────────────────────────────────────────

async function updateUI() {
  const data = await chrome.storage.local.get(['isActive', 'nextReloadAt', 'loop']);

  if (data.isActive) {
    dot.classList.add('active');
    statusText.textContent = 'Active';
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    loopCheckbox.disabled = true;

    if (data.nextReloadAt) {
      const remaining = data.nextReloadAt - Date.now();
      if (remaining > 0) {
        const totalSec = Math.ceil(remaining / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        countdown.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      } else {
        countdown.textContent = 'Reloading…';
      }
    }
  } else {
    dot.classList.remove('active');
    statusText.textContent = 'Inactive';
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    loopCheckbox.disabled = false;
    countdown.textContent = '';
  }

  // Keep checkbox in sync with stored loop preference
  if (data.loop != null) {
    loopCheckbox.checked = data.loop;
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────

startBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const loop = loopCheckbox.checked;
  const delayMinutes = Math.random() * 5; // 0–5 minutes
  const nextReloadAt = Date.now() + delayMinutes * 60 * 1000;

  // Clear any lingering alarm before creating a fresh one
  await chrome.alarms.clear(ALARM_NAME);

  await chrome.storage.local.set({
    tabId: tab.id,
    isActive: true,
    loop,
    nextReloadAt,
  });

  chrome.alarms.create(ALARM_NAME, { delayInMinutes: delayMinutes });

  updateUI();
});

// ── Stop ──────────────────────────────────────────────────────────────────────

stopBtn.addEventListener('click', async () => {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.storage.local.set({ isActive: false, nextReloadAt: null });
  updateUI();
});

// ── Live countdown (refresh every second while popup is open) ─────────────────

setInterval(updateUI, 1000);
updateUI();
