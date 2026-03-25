import { createRoot } from 'react-dom/client';
import { useState, useEffect, useRef } from 'react';
import { StickyNote, Move, Minimize2, X, Save, History, Clock, Edit2, Trash2 } from 'lucide-react';
import { getContextKey } from '../utils/domainUtils';

function NoteDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const [noteContent, setNoteContent] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentDomain, setCurrentDomain] = useState('');

  const [editingId, setEditingId] = useState(null);

  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 450 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentUrl(window.location.href);
    const domain = getContextKey(window.location.href, 'domain');
    setCurrentDomain(domain);
    loadNotes(domain);

    chrome.storage.local.get(['widgetVisible']).then(res => {
      if (res.widgetVisible === false) setIsVisible(false);
    });
  }, []);

  // ✅ Load notes for current domain from unified storage
  const loadNotes = async (domain) => {
    const data = await chrome.storage.local.get('notes');
    const allNotes = data.notes || [];
    const domainNotes = allNotes.filter(n => n.domain === domain);
    setSavedNotes(domainNotes.sort((a, b) => b.updatedAt - a.updatedAt));

    if (domainNotes.length > 0) {
      setNoteContent(domainNotes[0].content);
    } else {
      setNoteContent('');
    }
  };

  // ✅ Save to unified 'notes' array in storage
  const saveNote = async () => {
    if (!noteContent.trim() || !currentDomain) return;

    const data = await chrome.storage.local.get('notes');
    const allNotes = data.notes || [];

    let updatedNotes;

    if (editingId) {
      // Update existing note
      updatedNotes = allNotes.map(note => {
        if (note.id === editingId) {
          return {
            ...note,
            content: noteContent,
            updatedAt: Date.now()
          };
        }
        return note;
      });

      // Move to top
      const updatedNote = updatedNotes.find(n => n.id === editingId);
      updatedNotes = updatedNotes.filter(n => n.id !== editingId);
      updatedNotes = [updatedNote, ...updatedNotes];

      setEditingId(null);
    } else {
      // Create new note
      const newNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: noteContent,
        domain: currentDomain, // ✅ Store domain
        sourceUrl: window.location.href, // ✅ Keep original URL for reference
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      updatedNotes = [newNote, ...allNotes];
    }

    await chrome.storage.local.set({ notes: updatedNotes });
    setSavedNotes(updatedNotes.filter(n => n.domain === currentDomain));
  };

  const loadNoteIntoEditor = (noteToEdit) => {
    setNoteContent(noteToEdit.content);
    setEditingId(noteToEdit.id);
    const container = document.querySelector('#tab-van-dashboard-root div[style*="overflowY"]');
    if (container) container.scrollTop = 0;
  };

  const cancelEdit = () => {
    setNoteContent('');
    setEditingId(null);
  };

  const deleteNote = async (idToDelete) => {
    if (!confirm("Delete this note?")) return;

    const data = await chrome.storage.local.get('notes');
    const allNotes = data.notes || [];
    const updatedNotes = allNotes.filter(n => n.id !== idToDelete);

    await chrome.storage.local.set({ notes: updatedNotes });

    const domainNotes = updatedNotes.filter(n => n.domain === currentDomain);
    setSavedNotes(domainNotes);

    if (editingId === idToDelete) {
      setNoteContent('');
      setEditingId(null);
    } else if (domainNotes.length > 0 && !editingId) {
      setNoteContent(domainNotes[0].content);
    } else if (domainNotes.length === 0) {
      setNoteContent('');
    }
  };

  // ✅ Migration: Convert old hash-based storage to unified format
  const migrateOldNotes = async () => {
    try {
      const allData = await new Promise(resolve => chrome.storage.local.get(null, resolve));
      const oldKeys = Object.keys(allData).filter(k => k.startsWith('notes_history_'));

      if (oldKeys.length === 0) return;

      console.log(`🔄 Migrating ${oldKeys.length} old note keys...`);

      const data = await chrome.storage.local.get('notes');
      let unifiedNotes = data.notes || [];

      for (const oldKey of oldKeys) {
        const urlHash = oldKey.replace('notes_history_', '');
        let originalUrl = '';
        try { originalUrl = atob(urlHash); } catch (e) { continue; }

        const domain = getContextKey(originalUrl, 'section');
        if (!domain) continue;

        const oldNotes = allData[oldKey] || [];

        for (const note of oldNotes) {
          // Check if already migrated
          if (!unifiedNotes.some(n => n.content === note.content && n.createdAt === new Date(note.date).getTime())) {
            unifiedNotes.push({
              id: `migrated_${note.id}_${Math.random().toString(36).substr(2, 5)}`,
              content: note.content,
              domain: domain,
              sourceUrl: originalUrl,
              createdAt: new Date(note.date).getTime(),
              updatedAt: new Date(note.date).getTime()
            });
          }
        }

        await chrome.storage.local.remove(oldKey);
      }

      await chrome.storage.local.set({ notes: unifiedNotes });

      // Refresh current view
      if (currentDomain) {
        const domainNotes = unifiedNotes.filter(n => n.domain === currentDomain);
        setSavedNotes(domainNotes.sort((a, b) => b.updatedAt - a.updatedAt));
      }

      console.log(`✅ Migration complete. Total notes: ${unifiedNotes.length}`);

    } catch (err) {
      console.error('Migration failed:', err);
    }
  };

  const toggleVisibility = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    chrome.storage.local.set({ widgetVisible: newState });
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleMouseDown = (e) => {
    if (!isOpen) return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Listen for storage changes from popup
  useEffect(() => {
    const handleStorageChange = (changes, area) => {
      if (area === 'local' && changes.notes && currentDomain) {
        const updatedNotes = changes.notes.newValue || [];
        const domainNotes = updatedNotes.filter(n => n.domain === currentDomain);
        setSavedNotes(domainNotes.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [currentDomain]);

  useEffect(() => {
    if (currentDomain) {
      migrateOldNotes();
    }
  }, [currentDomain]);

  if (!isVisible) {
    return (
      <button onClick={toggleVisibility} style={{ position: 'fixed', bottom: '20px', right: '20px', width: '50px', height: '50px', borderRadius: '50%', background: '#667eea', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <StickyNote size={24} />
      </button>
    );
  }

  if (!isOpen) {
    return (
      <div onClick={toggleOpen} style={{ position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: savedNotes.length > 0 ? '#10b981' : '#667eea', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
        <StickyNote size={28} />
        {savedNotes.length > 0 && <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{savedNotes.length}</span>}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', left: position.x, top: position.y, width: '340px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 999999, fontFamily: '-apple-system, sans-serif', overflow: 'hidden', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>

      <div onMouseDown={handleMouseDown} style={{ padding: '12px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', cursor: 'move', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#374151' }}>
          <Move size={16} color="#9ca3af" />
          <span>{editingId ? '✏️ Editing Note' : 'My Notes'}</span>
          <span style={{ fontSize: '10px', background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px', color: '#6b7280' }}>
            {currentDomain || new URL(currentUrl).hostname}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {editingId && (
            <button onClick={cancelEdit} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold' }} title="Cancel Edit">
              Cancel
            </button>
          )}
          <button onClick={toggleOpen} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }} title="Minimize">
            <Minimize2 size={16} />
          </button>
          <button onClick={toggleVisibility} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }} title="Hide">
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>

        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder={editingId ? "Modify this note..." : "Write new note..."}
          style={{ width: '100%', height: '100px', padding: '10px', border: editingId ? '2px solid #f59e0b' : '1px solid #d1d5db', borderRadius: '8px', resize: 'none', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box', outline: 'none', marginBottom: '12px', backgroundColor: editingId ? '#fffbeb' : 'white' }}
        />

        <button onClick={saveNote} style={{ width: '100%', padding: '10px', background: editingId ? '#f59e0b' : '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
          <Save size={16} /> {editingId ? 'Update Note' : 'Save Note'}
        </button>

        {savedNotes.length > 0 && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '10px' }}>
              <History size={14} />
              <span>All Notes ({savedNotes.length})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {savedNotes.map((note) => (
                <div key={note.id} style={{
                  background: editingId === note.id ? '#fef3c7' : '#f9fafb',
                  padding: '10px',
                  borderRadius: '6px',
                  border: editingId === note.id ? '2px solid #f59e0b' : '1px solid #f3f4f6',
                  position: 'relative',
                  opacity: editingId === note.id ? 0.6 : 1
                }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', lineHeight: '1.4', whiteSpace: 'pre-wrap', color: '#374151' }}>{note.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {new Date(note.updatedAt).toLocaleDateString()}
                      {editingId === note.id && <span style={{ color: '#f59e0b', fontWeight: 'bold', marginLeft: '4px' }}>(Editing)</span>}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => loadNoteIntoEditor(note)}
                        disabled={editingId === note.id}
                        style={{
                          background: editingId === note.id ? '#e5e7eb' : '#e0e7ff',
                          border: 'none',
                          color: editingId === note.id ? '#9ca3af' : '#4338ca',
                          cursor: editingId === note.id ? 'not-allowed' : 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={editingId === note.id ? "Already editing" : "Edit this note"}
                      >
                        <Edit2 size={12} />
                      </button>

                      <button
                        onClick={() => deleteNote(note.id)}
                        style={{ background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                        title="Delete permanently"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inject
if (!document.getElementById('tab-van-dashboard-root')) {
  const div = document.createElement('div');
  div.id = 'tab-van-dashboard-root';
  document.body.appendChild(div);
  createRoot(div).render(<NoteDashboard />);
}