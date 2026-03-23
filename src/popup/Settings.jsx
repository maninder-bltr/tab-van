import React, { useState, useEffect } from 'react';
import { DEFAULT_TAB_RULES } from '../config/tabRules';
import { X, Plus, Save, Trash2 } from 'lucide-react';

function Settings({ onClose }) {
    const [rules, setRules] = useState(DEFAULT_TAB_RULES);
    const [newPattern, setNewPattern] = useState({ category: 'work', pattern: '' });

    useEffect(() => {
        // Load user's custom rules
        chrome.storage.local.get(['userRules'], (result) => {
            if (result.userRules) {
                setRules(result.userRules);
            }
        });
    }, []);

    const saveRules = async () => {
        await chrome.storage.local.set({ userRules: rules });
        alert('✅ Rules saved! Reload tabs to apply.');
        onClose?.();
    };

    const addPattern = () => {
        if (!newPattern.pattern.trim()) return;

        setRules(prev => ({
            ...prev,
            [newPattern.category]: {
                ...prev[newPattern.category],
                patterns: [...prev[newPattern.category].patterns, newPattern.pattern.trim()]
            }
        }));
        setNewPattern({ category: 'work', pattern: '' });
    };

    const removePattern = (category, index) => {
        setRules(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                patterns: prev[category].patterns.filter((_, i) => i !== index)
            }
        }));
    };

    return (
        <div className="settings-overlay">
            <div className="settings-modal">
                <div className="settings-header">
                    <h3>⚙️ Tab Rules</h3>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <div className="rules-list">
                    {Object.entries(rules).map(([key, config]) => (
                        <div key={key} className="rule-category">
                            <h4>{config.name}</h4>
                            <div className="patterns">
                                {config.patterns.map((pattern, idx) => (
                                    <span key={idx} className="pattern-tag">
                                        {pattern}
                                        <button onClick={() => removePattern(key, idx)}>
                                            <Trash2 size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="add-pattern">
                                <input
                                    type="text"
                                    placeholder="Add pattern (e.g., example.com)"
                                    value={newPattern.category === key ? newPattern.pattern : ''}
                                    onChange={(e) => setNewPattern({ category: key, pattern: e.target.value })}
                                    onKeyPress={(e) => e.key === 'Enter' && addPattern()}
                                />
                                {newPattern.category === key && (
                                    <button onClick={addPattern}><Plus size={16} /></button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={saveRules} className="save-rules-btn">
                    <Save size={16} /> Save Rules
                </button>
            </div>
        </div>
    );
}

export default Settings;