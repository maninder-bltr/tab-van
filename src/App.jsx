import React, { useState, useEffect } from 'react';
import { Users, StickyNote, Focus, LogOut, Plus, Trash2, RefreshCw, Shield, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('switcher');
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [currentDomain, setCurrentDomain] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // ✅ New Loading State
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    console.log('🔄 Setting up auth listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setIsLoading(false);
        }
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // Initialize app
    initializeApp();

    return () => subscription?.unsubscribe();
  }, []);

  const initializeApp = async () => {
    try {
      // 1. Check cached user first for instant UI
      const { currentUser } = await new Promise((resolve) => {
        chrome.storage.local.get(['currentUser'], (result) => resolve(result || {}));
      });
      if (currentUser?.email) {
        setUser(currentUser);
      }

      // 2. Verify with Supabase
      const { data: { user: supaUser } } = await supabase.auth.getUser();

      if (supaUser) {
        setUser(supaUser);
        // Update cache
        await new Promise((resolve) => {
          chrome.storage.local.set(
            { currentUser: { id: supaUser.id, email: supaUser.email } },
            () => resolve()
          );
        });
      } else {
        setUser(null);
        await new Promise((resolve) => chrome.storage.local.remove(['currentUser'], () => resolve()));
      }
    } catch (err) {
      console.warn('⚠️ Init error:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
      getCurrentTab();
      loadAccounts();
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    console.log('🔐 [1/6] Starting login flow...');

    try {
      console.log('🔐 [2/6] Requesting background login...');
      const res = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'googleLogin' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });

      if (!res?.success || !res.user) {
        throw new Error(res?.error || 'Login failed. Please try again.');
      }

      console.log('✅ [3/6] Login successful:', res.user.email);
      setUser(res.user);
      setIsLoading(false);
      setIsLoggingIn(false);

    } catch (error) {
      console.error('💥 Login failed:', error);
      const e = error;
      const code = e?.status || e?.code;
      const desc = e?.error_description || e?.message_details || e?.cause?.message;
      const base = e?.message || 'Login failed. Please try again.';
      const suffix = desc ? `\n${desc}` : code ? ` (code: ${code})` : '';
      const raw = `${base}${suffix}`;
      const redirectMismatchHint = /redirect_uri_mismatch/i.test(raw)
        ? `\n\nTip: In Google Cloud Console for the OAuth client_id in your manifest.json, ensure Authorized redirect URIs includes exactly https://${chrome.runtime.id}.chromiumapp.org (no trailing slash).`
        : '';
      setLoginError(`${raw}${redirectMismatchHint}`);
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await new Promise((resolve) => chrome.storage.local.remove(['currentUser'], () => resolve()));
    setUser(null);
    window.location.reload();
  };

  const getCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) setCurrentDomain(new URL(tab.url).hostname);
    } catch (e) { console.warn(e); }
  };

  const loadAccounts = async () => {
    try {
      const result = await new Promise((resolve) => chrome.storage.local.get(null, (r) => resolve(r || {})));
      const keys = Object.keys(result).filter(k => k.startsWith('account_'));
      setAccounts(keys.map((k) => ({ key: k, ...result[k] })));
    } catch (e) {
      console.warn('⚠️ loadAccounts failed:', e);
      setAccounts([]);
    }
  };

  const saveCurrentSession = async () => {
    const name = prompt('Enter account name (e.g., "Work"):');
    if (name && currentDomain) {
      chrome.runtime.sendMessage({ action: 'saveSession', name, domain: currentDomain });
      setTimeout(loadAccounts, 500);
    }
  };

  const switchAccount = async (account) => {
    const name = account.key.split('_')[1];
    chrome.runtime.sendMessage({ action: 'loadSession', name, domain: currentDomain }, (res) => {
      if (res?.success) chrome.tabs.reload();
      else alert('Failed to switch');
    });
  };

  const deleteAccount = async (key) => {
    await new Promise((resolve) => chrome.storage.local.remove([key], () => resolve()));
    loadAccounts();
  };

  const toggleFocusMode = async () => {
    const newState = !focusMode;
    setFocusMode(newState);
    chrome.runtime.sendMessage({ action: 'toggleFocusMode', enabled: newState });
  };

  const organizeTabs = (mode) => {
    chrome.runtime.sendMessage({ action: 'organizeTabs', mode });
  };

  // ✅ Render Loading State
  if (isLoading) {
    return (
      <div className="popup-container" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={32} color="#667eea" />
          <p style={{ marginTop: '10px', color: 'white' }}>Loading Tab-Van...</p>
        </div>
      </div>
    );
  }

  // ✅ Render Login Screen
  if (!user) {
    return (
      <div className="popup-container">
        <div className="login-screen">
          <h1>🌲 Tab-Van</h1>
          <p>Your Workspace Manager</p>
          <button onClick={handleLogin} className="login-btn" disabled={isLoggingIn}>
            {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : <Users size={20} />}
            {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
          {loginError ? (
            <p style={{ marginTop: 16, color: '#fecaca', fontSize: 13, lineHeight: '18px' }}>
              {loginError}
            </p>
          ) : (
            <p style={{ marginTop: 16, opacity: 0.85, fontSize: 13, lineHeight: '18px' }}>
              After you pick your Gmail account, this popup will update automatically.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ✅ Render Main App
  return (
    <div className="popup-container">
      <div className="header">
        <h1>🌲 Tab-Van</h1>
        <button onClick={handleLogout} className="logout-btn"><LogOut size={16} /></button>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'switcher' ? 'active' : ''}`} onClick={() => setActiveTab('switcher')}>
          <Users size={16} /> Accounts
        </button>
        <button className={`tab-btn ${activeTab === 'focus' ? 'active' : ''}`} onClick={() => setActiveTab('focus')}>
          <Focus size={16} /> Focus Mode
        </button>
      </div>

      {activeTab === 'switcher' && (
        <div className="content">
          <div className="domain-info">
            <span className="domain">{currentDomain}</span>
            <button onClick={saveCurrentSession} className="save-btn"><Plus size={16} /> Save Session</button>
          </div>
          <div className="accounts-list">
            {accounts.filter(acc => acc.key.includes(currentDomain)).map((account) => (
              <div key={account.key} className="account-card">
                <div className="account-info">
                  <Users size={20} />
                  <span>{account.key.split('_')[1]}</span>
                </div>
                <div className="account-actions">
                  <button onClick={() => switchAccount(account)} className="switch-btn"><RefreshCw size={16} /> Switch</button>
                  <button onClick={() => deleteAccount(account.key)} className="delete-btn"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {accounts.filter(acc => acc.key.includes(currentDomain)).length === 0 && (
              <p className="empty-state">No saved accounts for this domain</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'focus' && (
        <div className="content">
          <div className="focus-mode-card">
            <div className="focus-header"><Shield size={24} /><h3>Focus Mode</h3></div>
            <p>Block distracting websites</p>
            <button onClick={toggleFocusMode} className={`focus-toggle ${focusMode ? 'active' : ''}`}>
              {focusMode ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="organize-section">
            <h3>Organize Tabs</h3>
            <button onClick={() => organizeTabs('work')} className="organize-btn">💼 Group Work Tabs</button>
            <button onClick={() => organizeTabs('distractions')} className="organize-btn">🎮 Group Distractions</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;