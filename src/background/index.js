// src/background/index.js
import { supabase } from '../lib/supabase.js';
import {
    organizeTabsByIntent,
    saveWorkspaceWithOptions,
    restoreWorkspaceById,
    deleteWorkspace,
    unorganizeTabs,
    initializeSmartTabListeners,
    initializeTimeGuardListeners,
    getTimeGuardSummary
} from './workspaceTools.js';

initializeSmartTabListeners();
initializeTimeGuardListeners();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'googleLogin') {
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
        organizeTabsByIntent().then(sendResponse);
        return true;
    }
    else if (message.action === 'unorganizeTabs') {
        unorganizeTabs().then(sendResponse);
        return true;
    }
    else if (message.action === 'saveWorkspace') {
        saveWorkspaceWithOptions(message.name, message.mode).then(sendResponse);
        return true;
    }
    else if (message.action === 'restoreWorkspace') {
        restoreWorkspaceById(message.id).then(sendResponse);
        return true;
    }
    else if (message.action === 'deleteWorkspace') {
        deleteWorkspace(message.id).then(sendResponse);
        return true;
    }
    else if (message.action === 'getTimeGuardSummary') {
        getTimeGuardSummary().then(sendResponse);
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
        await organizeTabsByIntent(); // Auto-organize
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

        await organizeTabsByIntent(); // Auto-organize
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

        if (!data.session) {
            // Needs confirmation, don't auto-organize yet
        } else {
            await organizeTabsByIntent(); // Auto-organize
        }
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

        await organizeTabsByIntent(); // Auto-organize
        sendResponse({ success: true, user: finalUser });
    } catch (err) {
        console.error('💥 [background] googleLogin failed:', err);
        sendResponse({ success: false, error: err?.message || 'Google login failed' });
    }
}
