import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StickyNote, Globe, Clock, Trash2, Plus, Save } from 'lucide-react';
import './SidePanel.css';

function SidePanel() {
    const [notes, setNotes] = useState([]);
    const [currentNote, setCurrentNote] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [currentDomain, setCurrentDomain] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
        getCurrentTab();
    }, []);

    useEffect(() => {
        if (currentUrl && user) {
            loadNotes();
        }
    }, [currentUrl, user]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
    };

    const getCurrentTab = async () => {
        try {
            // Add safety check
            if (typeof chrome?.tabs?.query !== 'function') {
                console.warn('chrome.tabs API not available');
                return;
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.url) {
                setCurrentUrl(tab.url);
                setCurrentDomain(new URL(tab.url).hostname);
            }
        } catch (err) {
            console.error('Failed to get tab info:', err);
            // Fallback to window location if in a different context
            if (typeof window?.location !== 'undefined') {
                setCurrentUrl(window.location.href);
                setCurrentDomain(window.location.hostname);
            }
        }
    };

    const loadNotes = async () => {
        if (!user || !currentUrl) return;

        try {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', user.id)
                .eq('url_hash', btoa(currentUrl))
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setNotes(data);
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    };

    const saveNote = async () => {
        if (!user || !currentUrl || !currentNote.trim()) return;

        try {
            const { error } = await supabase.from('notes').insert({
                user_id: user.id,
                url_hash: btoa(currentUrl),
                domain: currentDomain,
                content: currentNote,
                is_global: false
            });

            if (error) throw error;

            setCurrentNote('');
            await loadNotes();
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note');
        }
    };

    const deleteNote = async (id) => {
        try {
            await supabase.from('notes').delete().eq('id', id);
            await loadNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    if (loading) {
        return <div className="sidepanel-container"><p>Loading...</p></div>;
    }

    if (!user) {
        return (
            <div className="sidepanel-container">
                <p>Please sign in through the extension popup</p>
            </div>
        );
    }

    return (
        <div className="sidepanel-container">
            <div className="sidepanel-header">
                <StickyNote size={24} />
                <h2>Page Notes</h2>
            </div>

            <div className="current-page">
                <Globe size={16} />
                <span title={currentUrl}>{currentDomain}</span>
            </div>

            <div className="note-input">
                <textarea
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    placeholder="Write a note for this page..."
                    rows="4"
                />
                <button onClick={saveNote} className="save-note-btn">
                    <Save size={16} />
                    Save Note
                </button>
            </div>

            <div className="notes-list">
                <h3>Saved Notes ({notes.length})</h3>
                {notes.map((note) => (
                    <div key={note.id} className="note-card">
                        <p>{note.content}</p>
                        <div className="note-meta">
                            <span className="note-date">
                                <Clock size={12} />
                                {new Date(note.created_at).toLocaleDateString()}
                            </span>
                            <button onClick={() => deleteNote(note.id)} className="delete-note">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {notes.length === 0 && (
                    <p className="empty-notes">No notes for this page yet</p>
                )}
            </div>
        </div>
    );
}

export default SidePanel;