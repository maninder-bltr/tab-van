// src/background/index.js
import { supabase } from '../lib/supabase.js';

function decodeJwtPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payloadBase64Url = parts[1];
        const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = payloadBase64.padEnd(payloadBase64.length + (4 - (payloadBase64.length % 4 || 4)) % 4, '=');
        const json = atob(padded);
        return JSON.parse(json);
    } catch (err) {
        console.warn('Failed to decode JWT payload:', err);
        return null;
    }
}
export const DEFAULT_TAB_RULES = {
    work: {
      name: '💼 Work',
      color: 'blue',
      patterns: [
        'github.com', 'gitlab.com', 'bitbucket.org', 'localhost', '127.0.0.1',
        'stackoverflow.com', 'docs.', 'notion.so', 'figma.com', 'jira.',
        'trello.com', 'linear.app', 'vercel.com', 'netlify.app', 'clickup.com',
        'asana.com', 'slack.com', 'microsoft.com', 'openai.com', 'qwen.ai',
        'deepseek.com', 'anthropic.com', 'perplexity.ai', 'groq.com',
      ]
    },
    distractions: {
      name: '🎮 Distractions',
      color: 'red',
      patterns: [
        'youtube.com', 'reddit.com', 'twitter.com', 'x.com', 'facebook.com',
        'instagram.com', 'whatsapp.com', 'tiktok.com', 'netflix.com',
        'hotstar.com', 'primevideo', 'mxplayer', 'twitch.tv'
      ]
    },
    learning: {
      name: '📚 Learning',
      color: 'yellow',
      patterns: [
        'coursera.org', 'udemy.com', 'freecodecamp.org', 'medium.com',
        'dev.to', 'hashnode.com'
      ]
    }
  };
  
  // Helper: Check if URL matches patterns
  const matchesPattern = (url, patterns) => {
    try {
      const hostname = new URL(url).hostname;
      return patterns.some(pattern => hostname.includes(pattern));
    } catch {
      return false;
    }
  };
// ✅ NEW: Auto-Group Listener using DEFAULT_TAB_RULES
chrome.tabs.onCreated.addListener(async (tab) => {
    if (!tab.url || tab.url === 'about:blank') return;
  
    // Iterate through all rule categories
    for (const [key, rule] of Object.entries(DEFAULT_TAB_RULES)) {
      if (matchesPattern(tab.url, rule.patterns)) {
        try {
          const groups = await chrome.tabGroups.query({ title: rule.name });
          let groupId;
  
          if (groups.length > 0) {
            groupId = groups[0].id;
          } else {
            // Only auto-create group if you want, otherwise skip
            // For now, let's create it so the tab has somewhere to go
            groupId = await chrome.tabs.group({ tabIds: [tab.id] });
            await chrome.tabGroups.update(groupId, { 
              title: rule.name, 
              color: rule.color, 
              collapsed: key === 'distractions' 
            });
            return; 
          }
  
          await chrome.tabs.group({ tabIds: [tab.id], groupId });
          console.log(`✅ Auto-grouped ${new URL(tab.url).hostname} into ${rule.name}`);
          return; // Stop after first match
        } catch (error) {
          console.error('Auto-group error:', error);
        }
      }
    }
  });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveSession') {
        saveAccountSession(message.name, message.domain).then(() => sendResponse({ success: true }));
        return true;
    }
    else if (message.action === 'loadSession') {
        loadAccountSession(message.name, message.domain).then(sendResponse);
        return true;
    }
    else if (message.action === 'googleLogin') {
        startGoogleLogin(sendResponse);
        return true;
    }
    else if (message.action === 'emailLogin') {
        handleEmailLogin(message.email, message.password, sendResponse);
        return true;
    }
    else if (message.action === 'emailSignup') {
        handleEmailSignup(message.email, message.password, sendResponse);
        return true;
    }
    else if (message.action === 'startGuestMode') {
        startGuestMode(sendResponse);
        return true;
    }
    else if (message.action === 'organizeTabs') {
        organizeTabs(message.mode).then(() => sendResponse({ success: true }));
        return true;
    }
    else if (message.action === 'toggleFocusMode') {
        toggleFocusMode(message.enabled).then(() => sendResponse({ success: true }));
        return true;
    }
    else if (message.action === 'openSidePanel') {
        chrome.sidePanel.open({ windowId: sender.tab.windowId }).then(() => sendResponse({ success: true }));
        return true;
    } else if (message.action === 'closeSidePanel') {
        // Note: Chrome doesn't have a direct "closeSidePanel" API command for extensions to force close it universally.
        // However, we can try to blur focus or just acknowledge.
        // The most reliable way in MV3 is actually handled by the browser when focus changes.
        // But we can send a response to let the UI know.
        sendResponse({ success: true });
        return true;
    }
    return false;
});

// --- Auth Handlers ---

async function startGuestMode(sendResponse) {
    try {
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const guestUser = {
            id: guestId,
            email: 'guest@tab-van.local',
            is_guest: true,
            app_metadata: { provider: 'guest' }
        };

        // Save to local storage only
        await new Promise(resolve => {
            chrome.storage.local.set({
                currentUser: guestUser,
                authMode: 'guest'
            }, resolve);
        });

        console.log('✅ Guest mode started:', guestId);
        sendResponse({ success: true, user: guestUser });
    } catch (err) {
        console.error('💥 Guest mode failed:', err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleEmailLogin(email, password, sendResponse) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        if (!data.user) throw new Error('No user returned');

        // Cache user
        await new Promise(resolve => {
            chrome.storage.local.set({
                currentUser: { ...data.user, is_guest: false },
                authMode: 'email'
            }, resolve);
        });

        sendResponse({ success: true, user: data.user });
    } catch (err) {
        console.error('💥 Email login failed:', err);
        sendResponse({ success: false, error: err.message });
    }
}

async function handleEmailSignup(email, password, sendResponse) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;
        
        // Note: User might need to confirm email depending on Supabase settings
        const user = data.user;
        if (!user) throw new Error('Signup failed');

        await new Promise(resolve => {
            chrome.storage.local.set({
                currentUser: { ...user, is_guest: false },
                authMode: 'email'
            }, resolve);
        });

        sendResponse({ success: true, user, needsConfirmation: !data.session });
    } catch (err) {
        console.error('💥 Email signup failed:', err);
        sendResponse({ success: false, error: err.message });
    }
}

// --- Existing Google Login ---
async function startGoogleLogin(sendResponse) {
    try {
        console.log('🔐 [background] Starting Google login...');
        const manifest = chrome.runtime.getManifest();
        const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org`;

        const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
        authUrl.searchParams.set('client_id', manifest.oauth2.client_id);
        authUrl.searchParams.set('response_type', 'id_token');
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', manifest.oauth2.scopes.join(' '));
        const nonce = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
        authUrl.searchParams.set('nonce', nonce);

        const redirectedTo = await new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
                { url: authUrl.href, interactive: true },
                (responseUrl) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    if (!responseUrl) {
                        reject(new Error('Authentication cancelled'));
                        return;
                    }
                    resolve(responseUrl);
                }
            );
        });

        const url = new URL(redirectedTo);
        const hashParams = new URLSearchParams(url.hash?.startsWith('#') ? url.hash.slice(1) : url.hash);
        const idToken = hashParams.get('id_token');
        const error = hashParams.get('error');

        if (error) throw new Error(`OAuth error: ${error}`);
        if (!idToken) throw new Error('No ID token received');

        const { error: signInError } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken
        });

        if (signInError) throw signInError;

        let finalUser = null;
        for (let i = 0; i < 6; i++) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) { finalUser = user; break; }
            await new Promise((r) => setTimeout(r, 250 * (i + 1)));
        }

        if (!finalUser) throw new Error('User not found after retries');

        await new Promise((resolve) => {
            chrome.storage.local.set({
                currentUser: { ...finalUser, is_guest: false },
                authMode: 'google'
            }, () => resolve());
        });

        sendResponse({ success: true, user: finalUser });
    } catch (err) {
        console.error('💥 [background] googleLogin failed:', err);
        sendResponse({ success: false, error: err?.message || 'Google login failed' });
    }
}

// --- Existing Tab/Cookie Functions (Unchanged) ---
async function saveAccountSession(name, domain) {
    const cookies = await chrome.cookies.getAll({ domain });
    await new Promise((resolve) => {
        chrome.storage.local.set({ [`account_${name}_${domain}`]: { name, domain, cookies, savedAt: new Date().toISOString() } }, () => resolve());
    });
}

async function loadAccountSession(name, domain) {
    const key = `account_${name}_${domain}`;
    const result = await new Promise((resolve) => {
        chrome.storage.local.get([key], (r) => resolve(r || {}));
    });
    const session = result[key];
    if (!session?.cookies) return { success: false, error: 'Not found' };

    const existing = await chrome.cookies.getAll({ domain });
    for (const c of existing) {
        try { await chrome.cookies.remove({ url: `http${c.secure ? 's' : ''}://${c.domain}${c.path}`, name: c.name }); } catch (e) { }
    }
    for (const c of session.cookies) {
        try {
            await chrome.cookies.set({
                url: `http${c.secure ? 's' : ''}://${c.domain}${c.path}`,
                name: c.name, value: c.value, path: c.path, domain: c.domain,
                secure: c.secure, httpOnly: c.httpOnly, expirationDate: c.expirationDate
            });
        } catch (e) { }
    }
    return { success: true };
}

async function organizeTabs(mode) {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const rules = {
        work: { patterns: ['github', 'localhost', 'stackoverflow', 'docs', 'notion', 'figma'], title: '💼 Work', color: 'blue' },
        distractions: { patterns: ['youtube', 'reddit', 'twitter', 'facebook', 'instagram'], title: '🎮 Distractions', color: 'red' }
    };
    const rule = rules[mode];
    if (!rule) return;

    const matching = tabs.filter(t => t.url && rule.patterns.some(p => t.url.includes(p)));
    if (matching.length > 0) {
        const groupId = await chrome.tabs.group({ tabIds: matching.map(t => t.id) });
        await chrome.tabGroups.update(groupId, { title: rule.title, color: rule.color, collapsed: mode === 'distractions' });
    }
}

async function toggleFocusMode(enabled) {
    const rules = [
        { id: 1, urlFilter: 'youtube.com' }, { id: 2, urlFilter: 'reddit.com' },
        { id: 3, urlFilter: 'twitter.com' }, { id: 4, urlFilter: 'facebook.com' }
    ];

    if (enabled) {
        await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [1, 2, 3, 4],
            addRules: rules.map(r => ({ id: r.id, priority: 1, action: { type: 'block' }, condition: { urlFilter: r.urlFilter, resourceTypes: ['main_frame'] } }))
        });
    } else {
        await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [1, 2, 3, 4], addRules: [] });
    }
}