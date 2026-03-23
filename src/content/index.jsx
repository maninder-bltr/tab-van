// Content script for Tab-Van note indicator
// ⚠️ Content scripts CANNOT use chrome.tabs API!
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { X, StickyNote } from 'lucide-react';

// Safe message sender with error handling
const sendMessage = (message) => {
    return new Promise((resolve, reject) => {
        try {
            if (typeof chrome?.runtime?.sendMessage !== 'function') {
                throw new Error('Chrome runtime not available');
            }

            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        } catch (error) {
            console.warn('Message send failed:', error);
            reject(error);
        }
    });
};

function NoteIndicator() {
    const [visible, setVisible] = useState(true);
    const [hasNote, setHasNote] = useState(false);
    const [currentPage, setCurrentPage] = useState({ url: '', domain: '' });
    const [loading, setLoading] = useState(true);

    // Load visibility state from storage
    useEffect(() => {
        const loadState = async () => {
            try {
                if (typeof chrome?.storage?.local !== 'undefined') {
                    const result = await chrome.storage.local.get(['noteIndicatorVisible']);
                    setVisible(result.noteIndicatorVisible !== false);
                }
            } catch (err) {
                console.warn('Could not load indicator state:', err);
            }
        };
        loadState();
    }, []);

    // Get page info WITHOUT using chrome.tabs
    useEffect(() => {
        const init = async () => {
            try {
                // Use window.location instead of chrome.tabs.query
                const url = window.location.href;
                const domain = window.location.hostname;

                setCurrentPage({ url, domain });

                // Check for existing note using URL hash
                if (typeof chrome?.storage?.local !== 'undefined') {
                    const urlHash = btoa(url);
                    const result = await chrome.storage.local.get([`note_${urlHash}`]);
                    setHasNote(!!result[`note_${urlHash}`]);
                }
            } catch (err) {
                console.warn('Could not get page info:', err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Handle page visibility changes (for back/forward cache)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !loading) {
                // Re-check note status when page becomes active
                const checkNote = async () => {
                    try {
                        const url = window.location.href;
                        if (typeof chrome?.storage?.local !== 'undefined') {
                            const urlHash = btoa(url);
                            const result = await chrome.storage.local.get([`note_${urlHash}`]);
                            setHasNote(!!result[`note_${urlHash}`]);
                        }
                    } catch (err) {
                        // Silently fail during transitions
                    }
                };
                checkNote();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [loading]);

    const handleClose = useCallback(async () => {
        setVisible(false);
        try {
            if (typeof chrome?.storage?.local !== 'undefined') {
                await chrome.storage.local.set({ noteIndicatorVisible: false });
            }
        } catch (err) {
            console.warn('Could not save indicator state:', err);
        }
    }, []);

    const handleOpenSidePanel = useCallback(async () => {
        try {
            // Request background script to open side panel
            await sendMessage({ action: 'openSidePanel' });
        } catch (err) {
            console.warn('Could not open side panel via message:', err);
            // Fallback: try direct API (only works in extension contexts)
            try {
                if (typeof chrome?.sidePanel?.open === 'function') {
                    // This won't work from content script, but no harm trying
                    await chrome.sidePanel.open({ windowId: -1 });
                }
            } catch (fallbackErr) {
                console.error('Fallback also failed:', fallbackErr);
            }
        }
    }, []);

    const handleReopen = useCallback(async () => {
        setVisible(true);
        try {
            if (typeof chrome?.storage?.local !== 'undefined') {
                await chrome.storage.local.set({ noteIndicatorVisible: true });
            }
        } catch (err) {
            console.warn('Could not save indicator state:', err);
        }
    }, []);

    // Don't render if still loading or on OAuth pages
    if (loading || currentPage.domain?.includes('accounts.google.com')) {
        return null;
    }

    if (!visible) {
        // Show minimal reopen button
        return (
            <button
                onClick={handleReopen}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2147483647,
                    transition: 'transform 0.2s'
                }}
                title="Show note button"
            >
                <StickyNote size={18} />
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 2147483647,
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}
        >
            {/* Main note button */}
            <button
                onClick={handleOpenSidePanel}
                style={{
                    backgroundColor: hasNote ? '#10b981' : '#667eea',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '50px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                title={hasNote ? 'View note' : 'Add note for this page'}
            >
                <StickyNote size={16} />
                {hasNote ? 'Note' : 'Add Note'}
            </button>

            {/* Close button */}
            <button
                onClick={handleClose}
                style={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
                    e.currentTarget.style.color = '#6b7280';
                }}
                title="Hide note button"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// Safe injection with domain filtering
function injectWidget() {
    // Skip injection on sensitive pages
    const blockedDomains = [
        'accounts.google.com',
        'chrome://',
        'chrome-extension://',
        'chrome.google.com'
    ];

    const currentDomain = window.location.hostname;
    if (blockedDomains.some(domain => currentDomain.includes(domain) || currentDomain.startsWith(domain))) {
        console.log('🚫 Skipping widget injection on:', currentDomain);
        return;
    }

    // Avoid duplicate injection
    if (document.getElementById('tab-van-widget-root')) {
        return;
    }

    const container = document.createElement('div');
    container.id = 'tab-van-widget-root';
    container.className = 'tab-van-widget';

    document.body.appendChild(container);

    try {
        const root = createRoot(container);
        root.render(<NoteIndicator />);
    } catch (err) {
        console.error('Failed to render widget:', err);
        container.remove();
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
} else {
    injectWidget();
}

// Re-inject on SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Re-check if we should inject on new URL
        const widget = document.getElementById('tab-van-widget-root');
        if (!widget) {
            injectWidget();
        }
    }
}).observe(document, { subtree: true, childList: true });