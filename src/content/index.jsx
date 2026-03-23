import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { X, StickyNote, Save, Trash2, Clock, Minimize2, Move, History, Edit2, RotateCcw } from 'lucide-react';

function NoteDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const [noteContent, setNoteContent] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [currentUrl, setCurrentUrl] = useState('');
  
  // ✅ NEW: Track which note ID is currently being edited (null = new note)
  const [editingId, setEditingId] = useState(null);
  
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 450 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentUrl(window.location.href);
    loadNotes();
    
    chrome.storage.local.get(['widgetVisible']).then(res => {
      if (res.widgetVisible === false) setIsVisible(false);
    });
  }, []);

  const loadNotes = async () => {
    const urlHash = btoa(window.location.href);
    const result = await new Promise(resolve => 
      chrome.storage.local.get([`notes_history_${urlHash}`], resolve)
    );
    
    const history = result[`notes_history_${urlHash}`] || [];
    setSavedNotes(history);
    
    if (history.length > 0) {
      setNoteContent(history[0].content);
    } else {
      setNoteContent('');
    }
  };

  const saveNote = async () => {
    if (!noteContent.trim()) return;
    
    const urlHash = btoa(window.location.href);
    
    let updatedHistory;

    if (editingId) {
      // ✅ UPDATE EXISTING NOTE
      updatedHistory = savedNotes.map(note => {
        if (note.id === editingId) {
          return {
            ...note,
            content: noteContent,
            date: new Date().toISOString() // Update timestamp
          };
        }
        return note;
      });
      // Move the updated note to the top of the list
      const updatedNote = updatedHistory.find(n => n.id === editingId);
      updatedHistory = updatedHistory.filter(n => n.id !== editingId);
      updatedHistory = [updatedNote, ...updatedHistory];
      
      setEditingId(null); // Reset editing mode
    } else {
      // ✅ CREATE NEW NOTE
      const newNote = {
        id: Date.now(),
        content: noteContent,
        date: new Date().toISOString()
      };
      updatedHistory = [newNote, ...savedNotes];
    }
    
    await chrome.storage.local.set({ [`notes_history_${urlHash}`]: updatedHistory });
    setSavedNotes(updatedHistory);
    
    // Optional: Clear text area after save if it was a new note? 
    // Let's keep it for now so user can see what they saved.
  };

  // ✅ Load note into editor AND set editingId
  const loadNoteIntoEditor = (noteToEdit) => {
    setNoteContent(noteToEdit.content);
    setEditingId(noteToEdit.id); // 🔑 Mark this ID as being edited
    
    // Scroll to top
    const container = document.querySelector('#tab-van-dashboard-root div[style*="overflowY"]');
    if(container) container.scrollTop = 0;
  };

  // ✅ Cancel editing mode (clears box and resets ID)
  const cancelEdit = () => {
    setNoteContent('');
    setEditingId(null);
  };

  const deleteNote = async (idToDelete) => {
    if(!confirm("Delete this note?")) return;
    
    const urlHash = btoa(window.location.href);
    const updatedHistory = savedNotes.filter(n => n.id !== idToDelete);
    
    await chrome.storage.local.set({ [`notes_history_${urlHash}`]: updatedHistory });
    setSavedNotes(updatedHistory);
    
    // If we deleted the note currently being edited, reset state
    if (editingId === idToDelete) {
      setNoteContent('');
      setEditingId(null);
    } else if (updatedHistory.length > 0 && !editingId) {
       // If not editing, just load the newest one into the box
       setNoteContent(updatedHistory[0].content);
    } else if (updatedHistory.length === 0) {
       setNoteContent('');
    }
  };

  const toggleVisibility = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    chrome.storage.local.set({ widgetVisible: newState });
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  // --- Dragging Logic ---
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
        {savedNotes.length > 0 && <span style={{fontSize:'10px', fontWeight:'bold'}}>{savedNotes.length}</span>}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', left: position.x, top: position.y, width: '340px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 999999, fontFamily: '-apple-system, sans-serif', overflow: 'hidden', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
      
      {/* Header */}
      <div onMouseDown={handleMouseDown} style={{ padding: '12px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', cursor: 'move', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#374151' }}>
          <Move size={16} color="#9ca3af" />
          <span>{editingId ? '✏️ Editing Note' : 'My Notes'}</span>
          <span style={{fontSize:'10px', background:'#e5e7eb', padding:'2px 6px', borderRadius:'4px', color:'#6b7280'}}>
            {new URL(currentUrl).hostname}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {editingId && (
             <button onClick={cancelEdit} style={{border:'none', background:'#fee2e2', color:'#ef4444', cursor:'pointer', borderRadius:'4px', padding:'4px 8px', fontSize:'11px', fontWeight:'bold'}} title="Cancel Edit">
               Cancel
             </button>
          )}
          <button onClick={toggleOpen} style={{border:'none', background:'none', cursor:'pointer', color:'#6b7280'}} title="Minimize">
            <Minimize2 size={16} />
          </button>
          <button onClick={toggleVisibility} style={{border:'none', background:'none', cursor:'pointer', color:'#ef4444'}} title="Hide">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        
        {/* Editor */}
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder={editingId ? "Modify this note..." : "Write new note..."}
          style={{ width: '100%', height: '100px', padding: '10px', border: editingId ? '2px solid #f59e0b' : '1px solid #d1d5db', borderRadius: '8px', resize: 'none', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box', outline: 'none', marginBottom: '12px', backgroundColor: editingId ? '#fffbeb' : 'white' }}
        />
        
        <button onClick={saveNote} style={{ width: '100%', padding: '10px', background: editingId ? '#f59e0b' : '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
          <Save size={16} /> {editingId ? 'Update Note' : 'Save Note'}
        </button>

        {/* Previous Notes List */}
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
                  opacity: editingId === note.id ? 0.6 : 1 // Dim the one being edited
                }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', lineHeight: '1.4', whiteSpace: 'pre-wrap', color: '#374151' }}>{note.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {new Date(note.date).toLocaleDateString()}
                      {editingId === note.id && <span style={{color:'#f59e0b', fontWeight:'bold', marginLeft:'4px'}}>(Editing)</span>}
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