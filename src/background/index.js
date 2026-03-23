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
    }
    return false;
});

async function startGoogleLogin(sendResponse) {
    try {
        console.log('🔐 [background] Starting Google login...');
        const manifest = chrome.runtime.getManifest();

        // Supabase's Chrome extension flow expects this exact redirect URI.
        // IMPORTANT: no trailing slash.
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

        console.log('🔐 [background] Extracting tokens...');
        const url = new URL(redirectedTo);
        const hashParams = new URLSearchParams(url.hash?.startsWith('#') ? url.hash.slice(1) : url.hash);
        const searchParams = url.searchParams;

        const idToken = hashParams.get('id_token') || searchParams.get('id_token');
        const error = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

        if (error) throw new Error(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
        if (!idToken) throw new Error('No ID token received (id_token missing)');

        const tokenPayload = decodeJwtPayload(idToken);
        const tokenNonce = tokenPayload?.nonce;
        const nonceForSupabase = tokenNonce || nonce;

        console.log('🔐 [background] Signing in to Supabase...');
        const { error: signInError } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken
          });

        if (signInError) throw signInError;

        // Wait for session to settle, then read it back.
        let finalUser = null;
        for (let i = 0; i < 6; i++) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                finalUser = user;
                break;
            }
            await new Promise((r) => setTimeout(r, 250 * (i + 1)));
        }

        if (!finalUser) throw new Error('Signed in, but user not found after retries');

        await new Promise((resolve) => {
            chrome.storage.local.set(
                { currentUser: { id: finalUser.id, email: finalUser.email } },
                () => resolve()
            );
        });

        console.log('✅ [background] Google login success:', finalUser.email);
        sendResponse({ success: true, user: finalUser });
    } catch (err) {
        console.error('💥 [background] googleLogin failed:', err);
        sendResponse({ success: false, error: err?.message || 'Google login failed' });
    }
}

async function saveAccountSession(name, domain) {
    const cookies = await chrome.cookies.getAll({ domain });
    await new Promise((resolve) => {
        chrome.storage.local.set(
            { [`account_${name}_${domain}`]: { name, domain, cookies, savedAt: new Date().toISOString() } },
            () => resolve()
        );
    });
}

async function loadAccountSession(name, domain) {
    const key = `account_${name}_${domain}`;
    const result = await new Promise((resolve) => {
        chrome.storage.local.get([key], (r) => resolve(r || {}));
    });
    const session = result[key];
    if (!session?.cookies) return { success: false, error: 'Not found' };

    // Clear existing
    const existing = await chrome.cookies.getAll({ domain });
    for (const c of existing) {
        try { await chrome.cookies.remove({ url: `http${c.secure ? 's' : ''}://${c.domain}${c.path}`, name: c.name }); } catch (e) { }
    }
    // Set new
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