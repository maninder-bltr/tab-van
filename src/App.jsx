import React, { useState, useEffect } from 'react';
import { Users, Mail, UserPlus, LogOut, Plus, Trash2, RefreshCw, Shield, Loader2, Eye, EyeOff, DoorOpen, Focus } from 'lucide-react';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('switcher');
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [currentDomain, setCurrentDomain] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  
  // Loading & Auth States
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'guest'
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    initializeApp();
    return () => {}; // Cleanup handled inside if needed
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      // 1. Check Local Storage for User & Mode
      const { currentUser, authMode: storedMode } = await new Promise(resolve => 
        chrome.storage.local.get(['currentUser', 'authMode'], resolve)
      );

      if (currentUser) {
        if (currentUser.is_guest) {
          // Guest mode: Just load from storage
          setUser(currentUser);
          setAuthMode('guest');
        } else {
          // Logged in: Verify with Supabase
          const { data: { user: supaUser } } = await supabase.auth.getUser();
          if (supaUser) {
            setUser(supaUser);
            setAuthMode(storedMode || 'google');
          } else {
            // Session expired
            clearAuth();
          }
        }
      } else {
        clearAuth();
      }
    } catch (err) {
      console.warn('Init error:', err);
      clearAuth();
    } finally {
      setIsLoading(false);
      getCurrentTab();
      loadAccounts();
    }
  };

  const clearAuth = async () => {
    setUser(null);
    setAuthMode('login');
    await chrome.storage.local.remove(['currentUser', 'authMode']);
  };

  // --- Handlers ---

  const handleGuestLogin = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const res = await sendMessage({ action: 'startGuestMode' });
      if (res.success) {
        setUser(res.user);
        setAuthMode('guest');
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailAuth = async (isSignup) => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setIsProcessing(true);
    setError('');
    
    try {
      const action = isSignup ? 'emailSignup' : 'emailLogin';
      const res = await sendMessage({ action, email, password });
      
      if (res.success) {
        setUser(res.user);
        setAuthMode('email');
        if (res.needsConfirmation) {
          alert('Please check your email to confirm your account before logging in.');
          clearAuth();
        }
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const res = await sendMessage({ action: 'googleLogin' });
      if (res.success) {
        setUser(res.user);
        setAuthMode('google');
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    if (!user?.is_guest) {
      await supabase.auth.signOut();
    }
    await chrome.storage.local.remove(['currentUser', 'authMode']);
    setUser(null);
    setAuthMode('login');
    window.location.reload();
  };

  // Helper for messaging
  const sendMessage = (msg) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(msg, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });
  };

  const getCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) setCurrentDomain(new URL(tab.url).hostname);
    } catch (e) { console.warn(e); }
  };

  const loadAccounts = async () => {
    const result = await new Promise(resolve => chrome.storage.local.get(null, resolve));
    const keys = Object.keys(result).filter(k => k.startsWith('account_'));
    setAccounts(keys.map(k => ({ key: k, ...result[k] })));
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
    await new Promise(resolve => chrome.storage.local.remove([key], resolve));
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

  // --- Render Functions ---

  if (isLoading) {
    return (
      <div className="popup-container loading-screen">
        <Loader2 className="animate-spin" size={40} color="#667eea" />
        <p>Loading Tab-Van...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="popup-container">
        <div className="login-screen">
          <h1>🌲 Tab-Van</h1>
          <p>Your Workspace Manager</p>
          
          {error && <div className="error-msg">{error}</div>}

          {authMode === 'guest' ? (
             <div className="guest-info">
               <p>Entering Guest Mode...</p>
               <Loader2 className="animate-spin" size={24} />
             </div>
          ) : (
            <>
              {/* Email Form */}
              <div className="auth-form">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isProcessing}
                  className="input-field"
                />
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isProcessing}
                    className="input-field"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                
                <button 
                  onClick={() => handleEmailAuth(authMode === 'signup')} 
                  className="btn-primary"
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18}/> : 
                   authMode === 'signup' ? <UserPlus size={18}/> : <Mail size={18}/>}
                  {authMode === 'signup' ? 'Sign Up' : 'Log In'}
                </button>
              </div>

              <div className="divider">OR</div>

              {/* Google Button */}
              <button onClick={handleGoogleLogin} className="btn-google" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <Users size={18}/>}
                Sign in with Google
              </button>

              {/* Guest Button */}
              <button onClick={handleGuestLogin} className="btn-guest" disabled={isProcessing}>
                <DoorOpen size={18} />
                Continue as Guest
              </button>

              {/* Toggle Mode */}
              <p className="toggle-auth">
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(''); }}>
                  {authMode === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main App Dashboard
  return (
    <div className="popup-container">
      <div className="header">
        <h1>🌲 Tab-Van</h1>
        <div className="user-info">
          <span style={{fontSize: '11px', opacity: 0.8, marginRight: '8px'}}>
            {user.is_guest ? 'Guest Mode' : user.email?.split('@')[0]}
          </span>
          <button onClick={handleLogout} className="logout-btn"><LogOut size={16} /></button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'switcher' ? 'active' : ''}`} onClick={() => setActiveTab('switcher')}>
          <Users size={16} /> Accounts
        </button>
        <button className={`tab-btn ${activeTab === 'focus' ? 'active' : ''}`} onClick={() => setActiveTab('focus')}>
          <Focus size={16} /> Focus
        </button>
      </div>

      {activeTab === 'switcher' && (
        <div className="content">
          <div className="domain-info">
            <span className="domain">{currentDomain}</span>
            <button onClick={saveCurrentSession} className="save-btn"><Plus size={16} /> Save</button>
          </div>
          <div className="accounts-list">
            {accounts.filter(acc => acc.key.includes(currentDomain)).map((account) => (
              <div key={account.key} className="account-card">
                <div className="account-info">
                  <Users size={20} />
                  <span>{account.name}</span>
                </div>
                <div className="account-actions">
                  <button onClick={() => switchAccount(account)} className="switch-btn"><RefreshCw size={16} /></button>
                  <button onClick={() => deleteAccount(account.key)} className="delete-btn"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {accounts.filter(acc => acc.key.includes(currentDomain)).length === 0 && (
              <p className="empty-state">No saved accounts</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'focus' && (
        <div className="content">
          <div className="focus-mode-card">
            <div className="focus-header"><Shield size={24} /><h3>Focus Mode</h3></div>
            <p>Block distractions</p>
            <button onClick={toggleFocusMode} className={`focus-toggle ${focusMode ? 'active' : ''}`}>
              {focusMode ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="organize-section">
            <button onClick={() => organizeTabs('work')} className="organize-btn">💼 Group Work</button>
            <button onClick={() => organizeTabs('distractions')} className="organize-btn">🎮 Group Fun</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;