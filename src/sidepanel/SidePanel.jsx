import React, { useState, useEffect } from 'react';
import { StickyNote, Globe, Clock, Trash2, Save, LogOut, X } from 'lucide-react';
import './SidePanel.css';
import { getContextKey } from '../utils/domainUtils';

function SidePanel() {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentDomain, setCurrentDomain] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initPanel();

    // ✅ AUTH & NOTES SYNC: Listen for storage changes
    const handleStorageChange = (changes, area) => {
      if (area === 'local') {
        if (changes.currentUser) {
          const newUser = changes.currentUser.newValue;
          setUser(newUser);
          setIsGuest(!!newUser?.is_guest);
          if (newUser && currentUrl) loadNotes(currentUrl);
          else if (!newUser) setNotes([]);
        }
        if (changes.notes) {
          loadNotes();
        }
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);

    // ✅ AUTO-HIDE LOGIC: Listen for tab updates
    const handleTabUpdate = (activeInfo) => {
      if (activeInfo.status === 'complete' && currentDomain) {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
          if (tab?.url) {
            const newDomain = getContextKey(tab.url);
            if (newDomain !== currentDomain) {
              setCurrentUrl(tab.url);
              setCurrentDomain(newDomain);
              setNotes([]);
            }
          }
        });
      }
    };

    chrome.tabs.onActivated.addListener(handleTabUpdate);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        handleTabUpdate({ tabId: tab.id, status: 'complete' });
      }
    });

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.tabs.onActivated.removeListener(handleTabUpdate);
    };
  }, [currentDomain, currentUrl]);

  const initPanel = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        setCurrentUrl(tab.url);
        setCurrentDomain(getContextKey(tab.url));
      }

      const { currentUser } = await new Promise(resolve =>
        chrome.storage.local.get(['currentUser', 'authMode'], resolve)
      );

      if (currentUser) {
        setUser(currentUser);
        setIsGuest(!!currentUser.is_guest);
        if (tab?.url) loadNotes(tab.url);
      } else {
        setUser(null);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadNotes = async (url = currentUrl) => {
    if (!user || !url) return;
    try {
      const domain = getContextKey(url);
      const data = await chrome.storage.local.get('notes');
      const allNotes = data.notes || [];
      const siteNotes = allNotes.filter(n => n.domain === domain);
      setNotes(siteNotes);
    } catch (e) { console.error(e); }
  };

  const saveNote = async () => {
    if (!user || !currentUrl || !currentNote.trim()) return;
    try {
      const domain = getContextKey(currentUrl);
      const newNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: currentNote.trim(),
        domain: domain,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const data = await chrome.storage.local.get('notes');
      const updatedNotes = [newNote, ...(data.notes || [])];
      await chrome.storage.local.set({ notes: updatedNotes });
      setCurrentNote('');
      loadNotes();
    } catch (e) { console.error(e); }
  };

  const deleteNote = async (id) => {
    if (!confirm("Delete note?")) return;
    try {
      const data = await chrome.storage.local.get('notes');
      const updatedNotes = (data.notes || []).filter(n => n.id !== id);
      await chrome.storage.local.set({ notes: updatedNotes });
      loadNotes();
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    if (confirm("Logout?")) {
      await chrome.storage.local.remove(['currentUser', 'authMode']);
      window.location.reload();
    }
  };

  const handleHidePanel = async () => {
    chrome.runtime.sendMessage({ action: 'closeSidePanel' }).catch(() => { });
  };

  if (loading) return <div className="sidepanel-container">Loading...</div>;
  if (!user) return (
    <div className="sidepanel-container" style={{ textAlign: 'center', paddingTop: 50 }}>
      <StickyNote size={48} color="#ccc" />
      <h3>Please sign in</h3>
      <button onClick={() => chrome.action.openPopup()} className="btn-primary" style={{ marginTop: 20 }}>Open Popup</button>
    </div>
  );

  return (
    <div className="sidepanel-container">
      <div className="sidepanel-header">
        <div className="header-left">
          <StickyNote size={24} color="#667eea" />
          <h2>{isGuest ? 'Guest Notes' : 'Page Notes'}</h2>
        </div>

        <div className="header-actions">
          <button onClick={handleHidePanel} className="icon-btn-small" title="Hide Panel" >
            🫣 Hide
          </button>

          <button onClick={handleLogout} className="logout-btn-small" title="Logout">
            <LogOut size={18} />
            <span style={{ fontSize: '12px', marginLeft: '6px' }}>Logout</span>
          </button>
        </div>
      </div>

      {isGuest && <div className="guest-warning">⚠️ Stored locally only</div>}

      {!currentDomain ? (
        <div className="empty-state-message">
          <p>👋 Navigate to a website to see notes.</p>
        </div>
      ) : (
        <>
          <div className="current-page"><Globe size={16} /><span>{currentDomain}</span></div>
          <div className="note-input">
            <textarea value={currentNote} onChange={e => setCurrentNote(e.target.value)} placeholder="Write note..." rows="4" />
            <button onClick={saveNote} className="save-note-btn"><Save size={16} /> Save</button>
          </div>
          <div className="notes-list">
            <h3>Notes ({notes.length})</h3>
            {notes.map(n => (
              <div key={n.id} className="note-card">
                <p>{n.content}</p>
                <div className="note-meta">
                  <span><Clock size={12} /> {new Date(n.updatedAt).toLocaleDateString()}</span>
                  <button onClick={() => deleteNote(n.id)} className="delete-note"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {notes.length === 0 && <p className="empty-notes">No notes yet</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default SidePanel;