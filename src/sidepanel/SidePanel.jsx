import React, { useState, useEffect } from 'react';
import { StickyNote, Globe, Clock, Trash2, Save, LogOut, X } from 'lucide-react';
import './SidePanel.css';

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
    
    // ✅ AUTO-HIDE LOGIC: Listen for tab updates
    const handleTabUpdate = (activeInfo) => {
      if (activeInfo.status === 'complete' && currentDomain) {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
          if (tab?.url) {
            const newDomain = new URL(tab.url).hostname;
            // If domain changed, close the side panel
            if (newDomain !== currentDomain) {
              console.log(' Domain changed, closing side panel');
              // We can't directly close side panel from content, but we can send message to background
              // However, simplest way in MV3 is often just letting user close it, 
              // BUT to force close, we rely on the fact that side panels usually stay open per context.
              // A better UX for "Auto Hide" is to just clear the UI or show a message.
              // Since Chrome doesn't allow extensions to forcibly close the side panel via API easily without user interaction,
              // We will implement the HIDE BUTTON as requested, and add a visual cue for tab switching.
              
              // Actually, let's try to close it by sending a message to background to toggle it off if possible,
              // or simply reset the state to show "No longer on this site".
              setCurrentUrl(''); 
              setCurrentDomain('');
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
      chrome.tabs.onActivated.removeListener(handleTabUpdate);
      // Cleanup listener
    };
  }, [currentDomain]);

  const initPanel = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        setCurrentUrl(tab.url);
        setCurrentDomain(new URL(tab.url).hostname);
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
    const urlHash = btoa(url);
    try {
      if (isGuest) {
        const result = await new Promise(resolve => 
          chrome.storage.local.get([`guest_note_${urlHash}`], resolve)
        );
        if (result[`guest_note_${urlHash}`]) {
          setNotes([{ id: 'local', content: result[`guest_note_${urlHash}`], created_at: new Date().toISOString() }]);
        } else { setNotes([]); }
      } else {
        import('../lib/supabase').then(({ supabase }) => {
           supabase.from('notes').select('*').eq('user_id', user.id).eq('url_hash', urlHash)
            .then(({ data }) => { if (data) setNotes(data); });
        });
      }
    } catch (e) { console.error(e); }
  };

  const saveNote = async () => {
    if (!user || !currentUrl || !currentNote.trim()) return;
    const urlHash = btoa(currentUrl);
    if (isGuest) {
      await chrome.storage.local.set({ [`guest_note_${urlHash}`]: currentNote });
      setNotes([{ id: 'local', content: currentNote, created_at: new Date().toISOString() }]);
      setCurrentNote('');
    } else {
      import('../lib/supabase').then(({ supabase }) => {
        supabase.from('notes').insert({ user_id: user.id, url_hash: urlHash, domain: currentDomain, content: currentNote })
          .then(({ error }) => { if (!error) { setCurrentNote(''); loadNotes(); } });
      });
    }
  };

  const deleteNote = async () => {
    if (!user || !currentUrl) return;
    const urlHash = btoa(currentUrl);
    if (isGuest) {
      await chrome.storage.local.remove([`guest_note_${urlHash}`]);
      setNotes([]);
    } else { setNotes([]); }
  };

  const handleLogout = async () => {
    if(confirm("Logout?")) {
      await chrome.storage.local.remove(['currentUser', 'authMode']);
      window.location.reload();
    }
  };

  // ✅ Function to Close/Hide Side Panel
  const handleHidePanel = async () => {
    // Send message to background to close side panel if possible, 
    // or simply navigate away/focus elsewhere. 
    // In MV3, we can't programmatically close side panel easily, 
    // but we can send a message to toggle it off if we implemented a toggle in background.
    // For now, we will send a message to background to attempt closing.
    chrome.runtime.sendMessage({ action: 'closeSidePanel' }).catch(() => {});
  };

  if (loading) return <div className="sidepanel-container">Loading...</div>;
  if (!user) return (
    <div className="sidepanel-container" style={{textAlign:'center', paddingTop:50}}>
      <StickyNote size={48} color="#ccc" />
      <h3>Please sign in</h3>
      <button onClick={() => chrome.action.openPopup()} className="btn-primary" style={{marginTop:20}}>Open Popup</button>
    </div>
  );

  return (
    <div className="sidepanel-container">
      {/* ✅ HEADER WITH HIDE BUTTON */}
      <div className="sidepanel-header">
        <div className="header-left">
          <StickyNote size={24} color="#667eea" />
          <h2>{isGuest ? 'Guest Notes' : 'Page Notes'}</h2>
        </div>
        
        <div className="header-actions">
          {/* ✅ THE HIDE/CROSS BUTTON */}
          <button onClick={handleHidePanel} className="icon-btn-small" title="Hide Panel" >
            🫣 Hide
          </button>
          
          {/* Logout Button */}
          <button onClick={handleLogout} className="logout-btn-small" title="Logout">
            <LogOut size={18} />
            <span style={{fontSize:'12px', marginLeft:'6px'}}>Logout</span>
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
            <textarea value={currentNote} onChange={e=>setCurrentNote(e.target.value)} placeholder="Write note..." rows="4" />
            <button onClick={saveNote} className="save-note-btn"><Save size={16}/> Save</button>
          </div>
          <div className="notes-list">
            <h3>Notes ({notes.length})</h3>
            {notes.map(n => (
              <div key={n.id} className="note-card">
                <p>{n.content}</p>
                <div className="note-meta">
                  <span><Clock size={12}/> {new Date(n.created_at).toLocaleDateString()}</span>
                  <button onClick={deleteNote} className="delete-note"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
            {notes.length===0 && <p className="empty-notes">No notes yet</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default SidePanel;