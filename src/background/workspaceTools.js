import { DEFAULT_TAB_RULES, matchesPattern } from '../config/tabRules.js';

const groupingLocks = new Map(); // key: `${windowId}_${category}`

const WORKSPACES_KEY = 'workspaces';
const TIME_GUARD_STATS_KEY = 'time_guard_stats';
const TIME_GUARD_ACTIVE_KEY = 'time_guard_active';
const TIME_GUARD_NUDGE_KEY = 'time_guard_latest_nudge';

const NUDGE_THRESHOLDS = [
  { seconds: 5 * 60, level: 'gentle', text: '5 mins on distractions. Quick stretch?' },
  { seconds: 15 * 60, level: 'strong', text: '15 mins already. Want to switch back to work?' },
  { seconds: 25 * 60, level: 'warning', text: '25 mins gone. You just wasted a serious block.' }
];

const getFromStorage = (keys) =>
  new Promise((resolve) => chrome.storage.local.get(keys, resolve));

const setToStorage = (data) =>
  new Promise((resolve) => chrome.storage.local.set(data, resolve));

const getHostname = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

const detectCategory = (url) => {
  for (const [key, rule] of Object.entries(DEFAULT_TAB_RULES)) {
    if (matchesPattern(url, rule.patterns)) return key;
  }
  return null;
};

const updateGroupVisuals = async (groupId, category) => {
  const groupConfig = DEFAULT_TAB_RULES[category];
  await chrome.tabGroups.update(groupId, {
    title: groupConfig.name,
    color: groupConfig.color,
    collapsed: category === 'distractions'
  });
};

async function groupTabByIntent(tab) {
  if (!tab?.id || !tab.url) return;
  const category = detectCategory(tab.url);
  if (!category) return;

  const lockKey = `${tab.windowId}_${category}`;

  // Wait if another grouping for this category/window is in progress
  while (groupingLocks.has(lockKey)) {
    await groupingLocks.get(lockKey);
  }

  // Set the lock
  let resolveLock;
  const lockPromise = new Promise(resolve => { resolveLock = resolve; });
  groupingLocks.set(lockKey, lockPromise);

  try {
    const groupConfig = DEFAULT_TAB_RULES[category];
    const existingGroups = await chrome.tabGroups.query({ windowId: tab.windowId, title: groupConfig.name });

    if (existingGroups.length > 0) {
      await chrome.tabs.group({ tabIds: [tab.id], groupId: existingGroups[0].id });
    } else {
      const groupId = await chrome.tabs.group({ tabIds: [tab.id] });
      await updateGroupVisuals(groupId, category);
    }
  } catch (err) {
    console.error('Grouping error:', err);
  } finally {
    groupingLocks.delete(lockKey);
    resolveLock();
  }
}

export async function organizeTabsByIntent() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const grouped = {};

  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;
    const category = detectCategory(tab.url);
    if (!category) continue;
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(tab.id);
  }

  for (const [category, tabIds] of Object.entries(grouped)) {
    if (!tabIds.length) continue;

    const firstTab = tabs.find(t => tabIds.includes(t.id));
    const lockKey = `${firstTab.windowId}_${category}`;

    while (groupingLocks.has(lockKey)) {
      await groupingLocks.get(lockKey);
    }

    let resolveLock;
    const lockPromise = new Promise(resolve => { resolveLock = resolve; });
    groupingLocks.set(lockKey, lockPromise);

    try {
      const groupConfig = DEFAULT_TAB_RULES[category];
      const existingGroups = await chrome.tabGroups.query({ windowId: firstTab.windowId, title: groupConfig.name });

      if (existingGroups.length > 0) {
        await chrome.tabs.group({ tabIds, groupId: existingGroups[0].id });
      } else {
        const groupId = await chrome.tabs.group({ tabIds });
        await updateGroupVisuals(groupId, category);
      }
    } catch (err) {
      console.error('Manual grouping error:', err);
    } finally {
      groupingLocks.delete(lockKey);
      resolveLock();
    }
  }

  return { success: true, groupsCreated: Object.keys(grouped).length };
}

export async function unorganizeTabs() {
  const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  const extensionGroupNames = Object.values(DEFAULT_TAB_RULES).map(r => r.name);

  let ungroupedCount = 0;
  for (const group of groups) {
    if (extensionGroupNames.includes(group.title)) {
      const tabs = await chrome.tabs.query({ groupId: group.id });
      const tabIds = tabs.map(t => t.id);
      if (tabIds.length > 0) {
        await chrome.tabs.ungroup(tabIds);
        ungroupedCount += tabIds.length;
      }
    }
  }
  return { success: true, ungroupedCount };
}

export async function initializeSmartTabListeners() {
  chrome.tabs.onCreated.addListener(async (tab) => {
    if (!tab?.url || tab.url === 'about:blank') return;
    await groupTabByIntent(tab);
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab?.active && tab.url) {
      await groupTabByIntent({ ...tab, id: tabId });
    }
  });
}

export async function saveWorkspaceWithOptions(name, mode = 'all') {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  let filteredTabs = tabs.filter(t => t.url && !t.url.startsWith('chrome://'));

  if (mode === 'work') {
    filteredTabs = filteredTabs.filter(t => detectCategory(t.url) === 'work');
  } else if (mode === 'exclude_distractions') {
    filteredTabs = filteredTabs.filter(t => detectCategory(t.url) !== 'distractions');
  }

  const newWorkspace = {
    id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: name || `Workspace ${new Date().toLocaleString()}`,
    tabs: filteredTabs.map(t => ({
      url: t.url,
      title: t.title || '',
      pinned: t.pinned
    })),
    createdAt: Date.now()
  };

  const { [WORKSPACES_KEY]: workspaces = [] } = await getFromStorage([WORKSPACES_KEY]);
  const updatedWorkspaces = [newWorkspace, ...workspaces];

  await setToStorage({ [WORKSPACES_KEY]: updatedWorkspaces });
  return { success: true, workspace: newWorkspace, count: updatedWorkspaces.length };
}

export async function restoreWorkspaceById(id) {
  const { [WORKSPACES_KEY]: workspaces = [] } = await getFromStorage([WORKSPACES_KEY]);
  const ws = workspaces.find(w => w.id === id);

  if (!ws || !ws.tabs?.length) {
    return { success: false, error: 'Workspace not found or empty' };
  }

  // Preserve order by iterating through tabs
  for (const item of ws.tabs) {
    if (!item.url) continue;
    await chrome.tabs.create({ url: item.url, pinned: item.pinned, active: false });
  }

  return { success: true, restored: ws.tabs.length };
}

export async function deleteWorkspace(id) {
  const { [WORKSPACES_KEY]: workspaces = [] } = await getFromStorage([WORKSPACES_KEY]);
  const updatedWorkspaces = workspaces.filter(w => w.id !== id);
  await setToStorage({ [WORKSPACES_KEY]: updatedWorkspaces });
  return { success: true };
}

// Keep the old ones for compatibility, but redirect them
export async function saveWorkspaceSnapshot() {
  return saveWorkspaceWithOptions('Default Snapshot', 'all');
}

export async function restoreWorkspaceSnapshot() {
  const { [WORKSPACES_KEY]: workspaces = [] } = await getFromStorage([WORKSPACES_KEY]);
  if (workspaces.length === 0) return { success: false, error: 'No snapshots found' };
  return restoreWorkspaceById(workspaces[0].id);
}

async function setBadgeForDistractionSeconds(seconds) {
  const wasted = Math.max(0, Math.floor(seconds || 0));
  const text = wasted > 0 ? `₹${wasted}` : '';
  await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  await chrome.action.setBadgeText({ text });
  await chrome.action.setTitle({ title: text ? `You just wasted ${text}` : 'Tab-Van' });
}

async function getTimeGuardState() {
  const data = await getFromStorage([
    TIME_GUARD_STATS_KEY,
    TIME_GUARD_ACTIVE_KEY,
    TIME_GUARD_NUDGE_KEY
  ]);
  return {
    stats: data[TIME_GUARD_STATS_KEY] || {},
    active: data[TIME_GUARD_ACTIVE_KEY] || null,
    latestNudge: data[TIME_GUARD_NUDGE_KEY] || null
  };
}

async function evaluateNudge(domain, totalSeconds) {
  const { latestNudge } = await getTimeGuardState();
  const threshold = [...NUDGE_THRESHOLDS].reverse().find((item) => totalSeconds >= item.seconds);
  if (!threshold) return null;

  const alreadySent =
    latestNudge &&
    latestNudge.domain === domain &&
    latestNudge.level === threshold.level;

  if (alreadySent) return null;

  const wastedAmount = Math.floor(totalSeconds);
  const message = `${threshold.text} You just wasted ₹${wastedAmount}.`;
  const payload = {
    domain,
    level: threshold.level,
    totalSeconds,
    wastedAmount,
    message,
    at: Date.now()
  };

  await setToStorage({ [TIME_GUARD_NUDGE_KEY]: payload });
  return payload;
}

async function flushActiveTime() {
  const { stats, active } = await getTimeGuardState();
  if (!active?.domain || !active?.startedAt) return null;

  const now = Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((now - active.startedAt) / 1000));
  if (!elapsedSeconds) return null;

  const domainStats = stats[active.domain] || { seconds: 0, isDistraction: false };
  const updated = {
    ...domainStats,
    seconds: domainStats.seconds + elapsedSeconds,
    isDistraction: Boolean(active.isDistraction)
  };

  const nextStats = { ...stats, [active.domain]: updated };
  await setToStorage({
    [TIME_GUARD_STATS_KEY]: nextStats,
    [TIME_GUARD_ACTIVE_KEY]: { ...active, startedAt: now }
  });

  if (updated.isDistraction) {
    await setBadgeForDistractionSeconds(updated.seconds);
    return evaluateNudge(active.domain, updated.seconds);
  }

  await setBadgeForDistractionSeconds(0);
  return null;
}

async function setActiveDomainFromTab(tab) {
  const domain = tab?.url ? getHostname(tab.url) : '';
  if (!domain) return;
  const category = detectCategory(tab.url);
  const isDistraction = category === 'distractions';

  await flushActiveTime();
  await setToStorage({
    [TIME_GUARD_ACTIVE_KEY]: { domain, startedAt: Date.now(), isDistraction }
  });

  if (!isDistraction) {
    await setBadgeForDistractionSeconds(0);
  }
}

export async function initializeTimeGuardListeners() {
  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const tab = await chrome.tabs.get(tabId);
    await setActiveDomainFromTab(tab);
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
      await setActiveDomainFromTab(tab);
    }
  });

  chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      await flushActiveTime();
      return;
    }
    const [activeTab] = await chrome.tabs.query({ active: true, windowId });
    if (activeTab) await setActiveDomainFromTab(activeTab);
  });
}

export async function getTimeGuardSummary() {
  await flushActiveTime();
  const { stats, latestNudge } = await getTimeGuardState();
  const distractionSeconds = Object.values(stats)
    .filter((entry) => entry.isDistraction)
    .reduce((acc, entry) => acc + entry.seconds, 0);

  return {
    success: true,
    stats,
    distractionSeconds,
    wastedAmount: distractionSeconds,
    latestNudge
  };
}
