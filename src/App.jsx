import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Mail, UserPlus, Users, LogOut, Loader2, Eye, EyeOff, DoorOpen, Sparkles, RotateCcw, Timer,
  LayoutDashboard, Trash2, Edit3, Check, Search, X, Globe, FileText, Home, FolderOpen, Plus, CheckCircle,
  BarChart3,
  TrendingUp,
  Calendar,
  Cloud
} from 'lucide-react';
import './App.css';
import { getContextKey } from './utils/domainUtils';
import { StorageService } from './utils/storage';
import { supabase } from './lib/supabase';

// ✅ HomeTab Component - Fixed Spacing
const HomeTab = ({ error, isTabsOrganized, toggleTabOrganization, isProcessing, timeGuard, setCurrentTab, loadTimeGuardAnalytics, showTimeGuardAnalytics, setShowTimeGuardAnalytics, timeGuardData }) => (
  <div className="content">
    {error && <div className="error-msg" style={{ color: '#991b1b', background: '#fee2e2', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Organize Tabs Card */}
      <div className="toggle-card" style={{
        background: 'white',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.2s'
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#667eea';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        }}>
        <div className="toggle-info" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          {isTabsOrganized ?
            <CheckCircle size={24} color="#10b981" strokeWidth={2.5} /> :
            <Sparkles size={24} color="#667eea" strokeWidth={2.5} />
          }
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>
              {isTabsOrganized ? 'Tabs Organized' : 'Organize Tabs'}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', lineHeight: '1.5' }}>
              {isTabsOrganized
                ? 'Groups active: Work & Distractions. Click to undo.'
                : 'Group tabs by Work/Distraction automatically.'}
            </div>
          </div>
        </div>

        <button
          onClick={toggleTabOrganization}
          disabled={isProcessing}
          className={`toggle-switch ${isTabsOrganized ? 'active' : ''}`}
          title={isTabsOrganized ? "Click to ungroup tabs" : "Click to group tabs"}
        >
          <span className={`toggle-knob ${isTabsOrganized ? 'active' : ''}`} />
        </button>
      </div>

      {/* Notes Quick Access Card */}
      <button
        disabled={isProcessing}
        onClick={() => setCurrentTab('notes')}
        className="btn-action-secondary"
        style={{
          background: 'white',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          textAlign: 'left',
          width: '100%',
          opacity: isProcessing ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!isProcessing) {
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{
          width: '44px',
          height: '44px',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FileText size={22} color="#667eea" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>Notes</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Quick Access</div>
        </div>
      </button>

      {/* Manage Workspaces Card */}
      <button
        disabled={isProcessing}
        onClick={() => setCurrentTab('workspaces')}
        className="btn-action-secondary"
        style={{
          background: 'white',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          textAlign: 'left',
          width: '100%',
          opacity: isProcessing ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!isProcessing) {
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{
          width: '44px',
          height: '44px',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FolderOpen size={22} color="#667eea" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>Manage Workspaces</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Snapshots & Restore</div>
        </div>
      </button>

      {/* Website Time Guard Card */}
      <div style={{
        background: 'white',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h4 style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: '700',
          color: '#1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Timer size={20} color="#667eea" strokeWidth={2} />
            Website Time Guard
          </div>
          <button
            onClick={loadTimeGuardAnalytics}
            style={{
              background: 'rgba(102, 126, 234, 0.1)',
              border: 'none',
              color: '#667eea',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(102, 126, 234, 0.2)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(102, 126, 234, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
            title="View detailed analytics"
          >
            <BarChart3 size={16} strokeWidth={2.5} />
            Analytics
          </button>
        </h4>

        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          padding: '16px',
          borderRadius: '10px',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#92400e', fontWeight: '600' }}>
            ⏱ 1 second = ₹1 lost
          </p>
          <p style={{ margin: 0, fontSize: '15px', color: '#78350f', fontWeight: '700' }}>
            You spent <strong>{timeGuard.timeSpent || 0}s</strong> → <strong>₹{timeGuard.wastedAmount || 0}</strong> lost 💸
          </p>
        </div>

        {timeGuard.latestNudge ? (
          <p style={{ margin: 0, fontStyle: 'italic', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
            "{timeGuard.latestNudge.message}"
          </p>
        ) : (
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', fontWeight: '500', textAlign: 'center' }}>
            Stay intentional. Every second counts.
          </p>
        )}
      </div>
      {/* Time Guard Analytics Modal */}
      {showTimeGuardAnalytics && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowTimeGuardAnalytics(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '16px 16px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
                <BarChart3 size={24} strokeWidth={2.5} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Time Guard Analytics</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>Track your distraction time</p>
                </div>
              </div>
              <button
                onClick={() => setShowTimeGuardAnalytics(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.3)';
                  e.target.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                  e.target.style.transform = 'rotate(0deg)';
                }}
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              {timeGuardData.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '2px dashed #e2e8f0'
                }}>
                  <BarChart3 size={48} style={{ opacity: 0.2, marginBottom: 16, color: '#667eea' }} />
                  <p style={{ margin: 0, fontSize: '15px', color: '#64748b', fontWeight: '500' }}>
                    No analytics data yet
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                    Start browsing distraction sites to see your usage patterns
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Summary Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      padding: '16px',
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: '600', marginBottom: '4px' }}>
                        Total Time
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#7f1d1d' }}>
                        {timeGuardData.reduce((acc, day) => acc + (day.totalSeconds || 0), 0)}s
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      padding: '16px',
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', marginBottom: '4px' }}>
                        Money Lost
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#78350f' }}>
                        ₹{timeGuardData.reduce((acc, day) => acc + (day.totalSeconds || 0), 0)}
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                      padding: '16px',
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#065f46', fontWeight: '600', marginBottom: '4px' }}>
                        Days Tracked
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#064e3b' }}>
                        {timeGuardData.length}
                      </div>
                    </div>
                  </div>

                  {/* Daily Breakdown */}
                  <div>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Calendar size={16} color="#667eea" />
                      Daily Breakdown
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {timeGuardData.slice(0, 7).map((day, index) => (
                        <div key={index} style={{
                          background: '#f8fafc',
                          border: '2px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '16px',
                          transition: 'all 0.2s'
                        }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#667eea';
                            e.currentTarget.style.background = '#f1f5f9';
                          }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '700',
                              color: '#1e293b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <Calendar size={14} color="#667eea" />
                              {day.date || `Day ${index + 1}`}
                            </div>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#ef4444'
                            }}>
                              {day.totalSeconds || 0}s → ₹{day.totalSeconds || 0}
                            </div>
                          </div>

                          {/* Site Breakdown */}
                          {day.sites && day.sites.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {day.sites.map((site, siteIndex) => (
                                <div key={siteIndex} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 12px',
                                  background: 'white',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#475569',
                                    flex: 1
                                  }}>
                                    <Globe size={14} color="#667eea" />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {site.domain}
                                    </span>
                                  </div>
                                  <div style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    minWidth: '60px',
                                    textAlign: 'right'
                                  }}>
                                    {site.seconds}s
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual Bar Chart */}
                  <div>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <TrendingUp size={16} color="#667eea" />
                      Time Spent (Last 7 Days)
                    </h4>

                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '8px',
                      height: '150px',
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0'
                    }}>
                      {timeGuardData.slice(0, 7).map((day, index) => {
                        const maxSeconds = Math.max(...timeGuardData.slice(0, 7).map(d => d.totalSeconds || 0));
                        const height = maxSeconds > 0 ? ((day.totalSeconds || 0) / maxSeconds) * 100 : 0;

                        return (
                          <div
                            key={index}
                            style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <div style={{
                              width: '100%',
                              height: `${Math.max(height, 5)}%`,
                              background: `linear-gradient(180deg, #667eea 0%, #764ba2 100%)`,
                              borderRadius: '6px 6px 0 0',
                              transition: 'all 0.3s',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '-24px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#667eea',
                                whiteSpace: 'nowrap'
                              }}>
                                {day.totalSeconds || 0}s
                              </div>
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: '#94a3b8',
                              fontWeight: '500',
                              textAlign: 'center',
                              transform: 'rotate(-45deg)',
                              transformOrigin: 'center',
                              marginTop: '20px'
                            }}>
                              {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ✅ NotesTab Component - Fixed Spacing
const NotesTab = memo(({
  notes,
  newNoteContent,
  setNewNoteContent,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  editingNoteId,
  setEditingNoteId,
  editContent,
  setEditContent,
  onAddGeneralNote,
  onDeleteNote,
  onStartEditing,
  onSaveEdit,
  isProcessing
}) => {
  const filteredNotes = notes
    .filter(n => {
      if (filter === 'website') return !!n.domain;
      if (filter === 'general') return !n.domain;
      return true;
    })
    .filter(n =>
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.domain && n.domain.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddGeneralNote();
    }
  };

  return (
    <div className="dashboard-container">
      {/* Add General Note Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
      }}>
        <label style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: '700',
          color: 'rgba(255,255,255,0.95)',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          📝 Quick General Note
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Type your note and press Enter..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.95)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: '#1e293b',
              fontSize: '14px',
              fontWeight: '500',
              outline: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.8)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              e.target.style.transform = 'translateY(0)';
            }}
          />
          <button
            onClick={onAddGeneralNote}
            disabled={!newNoteContent.trim() || isProcessing}
            style={{
              padding: '12px 24px',
              background: newNoteContent.trim() ? '#ffffff' : 'rgba(255,255,255,0.3)',
              color: newNoteContent.trim() ? '#667eea' : 'rgba(255,255,255,0.5)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: newNoteContent.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: newNoteContent.trim() ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (newNoteContent.trim()) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (newNoteContent.trim()) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
              }
            }}
          >
            <Plus size={18} strokeWidth={3} />
            Add
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '24px'
      }}>
        <Search size={18} style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#94a3b8',
          pointerEvents: 'none',
          zIndex: 1
        }} />
        <input
          type="text"
          placeholder="Search all notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 44px',
            background: '#f8fafc',
            color: '#1e293b',
            border: '2px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            outline: 'none',
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#667eea';
            e.target.style.background = 'white';
            e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
            e.target.style.background = '#f8fafc';
            e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
          }}
        />
      </div>

      {/* Filter Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {['all', 'website', 'general'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 20px',
              background: filter === f ? '#667eea' : '#f1f5f9',
              color: filter === f ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: filter === f ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'capitalize',
              boxShadow: filter === f ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (filter !== f) {
                e.target.style.background = '#e2e8f0';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== f) {
                e.target.style.background = '#f1f5f9';
              }
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'all' && notes.length > 0 && (
              <span style={{
                marginLeft: '6px',
                padding: '2px 6px',
                background: filter === f ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {notes.length}
              </span>
            )}
            {f === 'website' && notes.filter(n => n.domain).length > 0 && (
              <span style={{
                marginLeft: '6px',
                padding: '2px 6px',
                background: filter === f ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {notes.filter(n => n.domain).length}
              </span>
            )}
            {f === 'general' && notes.filter(n => !n.domain).length > 0 && (
              <span style={{
                marginLeft: '6px',
                padding: '2px 6px',
                background: filter === f ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {notes.filter(n => !n.domain).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredNotes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '2px dashed #e2e8f0'
          }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: 16, margin: '0 auto' }} />
            <p style={{ fontSize: '15px', marginBottom: '8px', color: '#64748b', fontWeight: '500' }}>
              {searchQuery ? 'No notes found matching your search.' :
                filter === 'general' ? 'No general notes yet. Write one above!' :
                  filter === 'website' ? 'No website notes yet.' :
                    'No notes yet. Start by writing a general note above!'}
            </p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div key={note.id} style={{
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px',
                  background: note.domain ? 'rgba(102, 126, 234, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: note.domain ? '#667eea' : '#10b981',
                  borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {note.domain ? <><Globe size={12} /> {note.domain}</> : '📌 General'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {editingNoteId === note.id ? (
                    <button onClick={() => onSaveEdit(note.id)}
                      style={{
                        background: '#10b981', border: 'none', color: 'white',
                        padding: '8px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#059669';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#10b981';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                  ) : (
                    <button onClick={() => onStartEditing(note)}
                      style={{
                        background: '#f1f5f9', border: 'none', color: '#64748b',
                        padding: '8px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#667eea';
                        e.target.style.color = 'white';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#f1f5f9';
                        e.target.style.color = '#64748b';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      <Edit3 size={16} strokeWidth={2} />
                    </button>
                  )}
                  <button onClick={() => onDeleteNote(note.id)}
                    style={{
                      background: '#fee2e2', border: 'none', color: '#ef4444',
                      padding: '8px', borderRadius: '8px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#ef4444';
                      e.target.style.color = 'white';
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#fee2e2';
                      e.target.style.color = '#ef4444';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
              {editingNoteId === note.id ? (
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} autoFocus
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#f8fafc',
                    border: '2px solid #667eea',
                    borderRadius: '8px',
                    color: '#1e293b',
                    fontSize: '14px',
                    fontWeight: '500',
                    outline: 'none',
                    minHeight: '80px',
                    lineHeight: '1.5',
                    resize: 'vertical'
                  }} />
              ) : (
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#1e293b',
                  fontWeight: '500',
                  whiteSpace: 'pre-wrap'
                }}>
                  {note.content}
                </p>
              )}
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #f1f5f9',
                fontSize: '11px',
                color: '#94a3b8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: '500' }}>
                  Updated {new Date(note.updatedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
                {note.sourceUrl && (
                  <span style={{
                    background: '#f1f5f9',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}>
                    {new URL(note.sourceUrl).hostname}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

// ✅ WorkspacesTab Component - Fixed Spacing & Bottom Line
const WorkspacesTab = ({ workspaces, isWorkspaceModalOpen, setIsWorkspaceModalOpen, workspaceName, setWorkspaceName, workspaceFilter, setWorkspaceFilter, isProcessing, handleSaveWorkspace, handleRestoreWorkspace, handleDeleteWorkspace }) => (
  <div className="workspaces-container">
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    }}>
      <h2 style={{
        fontSize: '20px',
        margin: 0,
        fontWeight: '700',
        color: '#1e293b'
      }}>
        Workspaces
      </h2>
      <button
        onClick={() => setIsWorkspaceModalOpen(true)}
        className="btn-save-new"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '10px',
          fontWeight: '600',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        }}
      >
        <Plus size={18} strokeWidth={3} />
        Save Snap
      </button>
    </div>

    <div className="workspaces-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {workspaces.length === 0 ? (
        <div className="empty-state" style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '2px dashed #e2e8f0'
        }}>
          <FolderOpen size={48} style={{ opacity: 0.2, marginBottom: 16, margin: '0 auto', color: '#667eea' }} />
          <p style={{ margin: 0, fontSize: '15px', color: '#64748b', fontWeight: '500' }}>No saved workspaces yet.</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Click "Save Snap" to create your first workspace!</p>
        </div>
      ) : (
        workspaces.map(ws => (
          <div key={ws.id} className="workspace-card" style={{
            background: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
            <div className="ws-info">
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{ws.name}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                <strong>{ws.tabs.length}</strong> tabs • {new Date(ws.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="ws-actions" style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleRestoreWorkspace(ws.id)}
                className="icon-btn"
                title="Restore"
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#10b981',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#10b981';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f1f5f9';
                  e.target.style.color = '#10b981';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <RotateCcw size={18} strokeWidth={2} />
              </button>
              <button
                onClick={() => handleDeleteWorkspace(ws.id)}
                className="icon-btn delete"
                title="Delete"
                style={{
                  background: '#fee2e2',
                  border: 'none',
                  color: '#ef4444',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ef4444';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fee2e2';
                  e.target.style.color = '#ef4444';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <Trash2 size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>

    {isWorkspaceModalOpen && (
      <div className="modal-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div className="modal-content" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div className="modal-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Save Workspace</h3>
            <button
              onClick={() => setIsWorkspaceModalOpen(false)}
              style={{
                background: '#f1f5f9',
                border: 'none',
                color: '#64748b',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ef4444';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f1f5f9';
                e.target.style.color = '#64748b';
              }}
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          <div className="modal-body">
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                Name Your Workspace
              </label>
              <input
                type="text"
                placeholder="e.g. Work Morning, Side Project..."
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
                autoFocus
                className="modal-input"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#1e293b',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#f8fafc';
                }}
              />
            </div>

            <div className="options-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '12px' }}>
                Filter Options
              </label>
              <div className="filter-options" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: workspaceFilter === 'all' ? 'rgba(102, 126, 234, 0.1)' : '#f8fafc',
                  border: workspaceFilter === 'all' ? '2px solid #667eea' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    value="all"
                    checked={workspaceFilter === 'all'}
                    onChange={() => setWorkspaceFilter('all')}
                    style={{ accentColor: '#667eea' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Save all tabs</span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: workspaceFilter === 'exclude_distractions' ? 'rgba(102, 126, 234, 0.1)' : '#f8fafc',
                  border: workspaceFilter === 'exclude_distractions' ? '2px solid #667eea' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    value="exclude_distractions"
                    checked={workspaceFilter === 'exclude_distractions'}
                    onChange={() => setWorkspaceFilter('exclude_distractions')}
                    style={{ accentColor: '#667eea' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Exclude Distractions</span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: workspaceFilter === 'work' ? 'rgba(102, 126, 234, 0.1)' : '#f8fafc',
                  border: workspaceFilter === 'work' ? '2px solid #667eea' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    value="work"
                    checked={workspaceFilter === 'work'}
                    onChange={() => setWorkspaceFilter('work')}
                    style={{ accentColor: '#667eea' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Work tabs only</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{
            display: 'flex',
            gap: '10px',
            marginTop: '24px'
          }}>
            <button
              onClick={() => setIsWorkspaceModalOpen(false)}
              className="btn-modal-secondary"
              style={{
                flex: 1,
                padding: '12px',
                background: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f1f5f9';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWorkspace}
              className="btn-modal-primary"
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '12px',
                background: isProcessing ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                opacity: isProcessing ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Save Snapshot'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

// ✅ MAIN APP COMPONENT
function App() {
  const [user, setUser] = useState(null);
  const [timeGuard, setTimeGuard] = useState({ wastedAmount: 0, latestNudge: null });
  const [isTabsOrganized, setIsTabsOrganized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const [workspaces, setWorkspaces] = useState([]);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
  const [syncMessage, setSyncMessage] = useState('');
  const [hasLocalData, setHasLocalData] = useState(false);
  const [showTimeGuardAnalytics, setShowTimeGuardAnalytics] = useState(false);
  const [timeGuardData, setTimeGuardData] = useState([]);

  useEffect(() => {
    initializeApp();
    migrateNotes();
    loadAllNotes();
    loadWorkspaces();
    checkTabOrganizationState();

    const handleStorageChange = (changes, area) => {
      if (area === 'local') {
        if (changes.notes) setNotes(changes.notes.newValue || []);
        if (changes.workspaces) setWorkspaces(changes.workspaces.newValue || []);
      }
    };
    const onTabUpdated = () => checkTabOrganizationState();
    chrome.tabs.onUpdated.addListener(onTabUpdated);
    chrome.tabs.onMoved.addListener(onTabUpdated);

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.tabs.onUpdated.removeListener(onTabUpdated);
      chrome.tabs.onMoved.removeListener(onTabUpdated);
    };
  }, []);

  const checkTabOrganizationState = async () => {
    const data = await chrome.storage.local.get(['organizedTabs', 'lastTabCheck']);
    const organizedTabs = data.organizedTabs || {};
    const lastCheck = data.lastTabCheck || 0;
    const now = Date.now();

    if (now - lastCheck < 300000) {
      setIsTabsOrganized(Object.keys(organizedTabs).length > 0);
      return;
    }

    const allTabs = await chrome.tabs.query({});
    const activeTabs = allTabs.filter(t => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('about:'));

    let organizedCount = 0;
    activeTabs.forEach(tab => {
      const key = getContextKey(tab.url, 'domain');
      if (key && organizedTabs[key]) {
        organizedCount++;
      }
    });

    const organized = organizedCount > 0;
    setIsTabsOrganized(organized);
    await chrome.storage.local.set({ organizedTabs: organized ? organizedTabs : {}, lastTabCheck: now });
  };

  const toggleTabOrganization = async () => {
    setIsProcessing(true);
    setError('');
    try {
      if (isTabsOrganized) {
        const res = await sendMessage({ action: 'unorganizeTabs' });
        if (!res?.success) throw new Error(res?.error || 'Failed to unorganize');
        setIsTabsOrganized(false);
      } else {
        const res = await sendMessage({ action: 'organizeTabs' });
        if (!res?.success) throw new Error(res?.error || 'Failed to organize');
        setIsTabsOrganized(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadAllNotes = async () => {
    try {
      const notes = await StorageService.loadNotes();
      console.log('[App] Loaded notes:', notes.length);
      setNotes(notes);
    } catch (err) {
      console.error('Failed to load notes:', err);
      setNotes([]);
    }
  };

  const loadWorkspaces = async () => {
    try {
      const workspaces = await StorageService.loadWorkspaces();
      setWorkspaces(workspaces);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setWorkspaces([]);
    }
  };

  const migrateNotes = async () => {
    try {
      const allData = await new Promise(resolve => chrome.storage.local.get(null, resolve));
      const existingNotes = Array.isArray(allData.notes) ? allData.notes : [];
      const keys = Object.keys(allData);
      let migratedCount = 0;
      const newNotes = [...existingNotes];

      for (const key of keys) {
        if (key.startsWith('guest_note_')) {
          const urlHash = key.replace('guest_note_', '');
          let url = '';
          try { url = atob(urlHash); } catch (e) { console.warn('Hash fail:', urlHash); }
          const domain = url ? getContextKey(url, 'domain') : null;
          const content = allData[key];
          if (!newNotes.some(n => n.content === content && n.domain === domain)) {
            newNotes.push({
              id: `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${migratedCount++}`,
              content: content,
              domain: domain,
              sourceUrl: url,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
          await chrome.storage.local.remove(key);
        }
      }

      if (migratedCount > 0) {
        await chrome.storage.local.set({ notes: newNotes });
        setNotes(newNotes);
        console.log(`✅ [App] Migrated ${migratedCount} notes.`);
      }
    } catch (err) {
      console.error('[App] Migration failed:', err);
    }
  };

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      const { currentUser, authMode: storedMode } = await new Promise(resolve =>
        chrome.storage.local.get(['currentUser', 'authMode'], resolve)
      );

      if (currentUser) {
        if (currentUser.is_guest) {
          setUser(currentUser);
          setAuthMode('guest');
        } else {
          const { data: { user: supaUser } } = await supabase.auth.getUser();
          if (supaUser) {
            setUser(supaUser);
            setAuthMode(storedMode || 'google');
            // Check for local data to sync
            await checkForLocalData();
          } else {
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
      refreshTimeGuard();
    }
  };

  const clearAuth = async () => {
    setUser(null);
    setAuthMode('login');
    await chrome.storage.local.remove(['currentUser', 'authMode']);
  };

  const handleGuestLogin = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const res = await sendMessage({ action: 'startGuestMode' });
      if (res.success) { setUser(res.user); setAuthMode('guest'); }
      else { throw new Error(res.error); }
    } catch (err) { setError(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleEmailAuth = async (isSignup) => {
    if (!email || !password) { setError('Please enter both email and password'); return; }
    setIsProcessing(true); setError('');
    try {
      const action = isSignup ? 'emailSignup' : 'emailLogin';
      const res = await sendMessage({ action, email, password });
      if (res.success) {
        setUser(res.user); setAuthMode('email');
        if (res.needsConfirmation) { alert('Please check your email to confirm your account before logging in.'); clearAuth(); }
      } else { throw new Error(res.error); }
    } catch (err) { setError(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleGoogleLogin = async () => {
    setIsProcessing(true); setError('');
    try {
      const res = await sendMessage({ action: 'googleLogin' });
      if (res.success) { setUser(res.user); setAuthMode('google'); }
      else { throw new Error(res.error); }
    } catch (err) { setError(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleLogout = async () => {
    // if (!user?.is_guest) await supabase.auth.signOut();
    await chrome.storage.local.remove(['currentUser', 'authMode']);
    setUser(null); setAuthMode('login'); window.location.reload();
  };

  const sendMessage = (msg) => new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (res) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(res);
    });
  });

  // Function to load time guard analytics
  const loadTimeGuardAnalytics = async () => {
    try {
      const data = await chrome.storage.local.get('timeGuardHistory');
      setTimeGuardData(data.timeGuardHistory || []);
      setShowTimeGuardAnalytics(true);
    } catch (err) {
      console.error('Failed to load time guard data:', err);
    }
  };

  const refreshTimeGuard = async () => {
    try {
      const res = await sendMessage({ action: 'getTimeGuardSummary' });
      if (res?.success) setTimeGuard({ wastedAmount: res.wastedAmount || 0, latestNudge: res.latestNudge || null });
    } catch (err) { console.warn('Time guard refresh failed:', err); }
  };

  const handleAction = async (fn) => {
    setIsProcessing(true); setError('');
    try { await fn(); await refreshTimeGuard(); }
    catch (err) { setError(err.message); }
    finally { setIsProcessing(false); }
  };

  // ✅ Notes Handlers
  const handleAddGeneralNote = async () => {
    if (!newNoteContent.trim()) return;
    const newNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: newNoteContent.trim(),
      domain: null,
      sourceUrl: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updatedNotes = [newNote, ...notes];
    try {
      await StorageService.saveNotes(updatedNotes);
      setNotes(updatedNotes);
      setNewNoteContent('');
      if (filter === 'website') setFilter('general');
    } catch (err) {
      setError('Failed to save note: ' + err.message);
    }
  };

  const deleteNote = async (id) => {
    if (!confirm('Delete this note?')) return;
    const updatedNotes = notes.filter(n => n.id !== id);
    try {
      await StorageService.saveNotes(updatedNotes);
    } catch (err) {
      setError('Failed to delete note: ' + err.message);
    }
  };

  const startEditing = (note) => { setEditingNoteId(note.id); setEditContent(note.content); };

  const saveEdit = async (id) => {
    const updatedNotes = notes.map(n =>
      n.id === id ? { ...n, content: editContent, updatedAt: Date.now() } : n
    );
    try {
      await StorageService.saveNotes(updatedNotes);
      setEditingNoteId(null);
    } catch (err) {
      setError('Failed to save edit: ' + err.message);
    }
  };

  // Add sync function
  const handleSyncToCloud = async () => {
    setSyncStatus('syncing');
    try {
      const { syncedCount, errors } = await StorageService.syncLocalToCloud();

      if (errors.length > 0) {
        setSyncStatus('error');
        setSyncMessage(`Synced ${syncedCount} items, but some errors occurred`);
      } else {
        setSyncStatus('success');
        setSyncMessage(`Successfully synced ${syncedCount} items to cloud!`);

        // Optional: Clear local data after successful sync
        // await StorageService.clearLocalData();

        setTimeout(() => {
          setShowSyncModal(false);
          setSyncStatus('idle');
          setSyncMessage('');
        }, 2000);
      }
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(err.message);
    }
  };

  // Check for local data on login
  const checkForLocalData = async () => {
    const data = await new Promise((resolve) => {
      chrome.storage.local.get(['notes', 'workspaces', 'timeGuardHistory'], resolve);
    });

    const hasData =
      (data.notes && data.notes.length > 0) ||
      (data.workspaces && data.workspaces.length > 0) ||
      (data.timeGuardHistory && data.timeGuardHistory.length > 0);

    setHasLocalData(hasData);

    if (hasData) {
      setShowSyncModal(true);
    }
  };

  // ✅ Workspace Handlers
  const handleSaveWorkspace = async () => {
    if (!workspaceName.trim()) {
      alert('Please enter a workspace name');
      return;
    }

    console.log('[Workspace] Starting save process...');
    console.log('[Workspace] Name:', workspaceName);
    console.log('[Workspace] Filter:', workspaceFilter);

    setIsProcessing(true);
    setError('');

    try {
      // Step 1: Send message to background to save workspace
      console.log('[Workspace] Sending message to background...');
      const res = await sendMessage({
        action: 'saveWorkspace',
        name: workspaceName,
        mode: workspaceFilter
      });

      console.log('[Workspace] Background response:', res);

      if (res.success) {
        // Step 2: Get workspaces from local storage
        console.log('[Workspace] Reading from local storage...');
        const { workspaces: localWorkspaces } = await chrome.storage.local.get('workspaces');
        console.log('[Workspace] Local workspaces:', localWorkspaces?.length || 0);

        // Step 3: Save to Supabase if authenticated
        const isAuth = await StorageService.isAuthenticated();
        console.log('[Workspace] Is authenticated:', isAuth);

        if (isAuth && localWorkspaces) {
          console.log('[Workspace] Saving to Supabase...');
          await StorageService.saveWorkspaces(localWorkspaces);
          console.log('[Workspace] Saved to Supabase successfully');
        }

        // Step 4: Reload workspaces
        console.log('[Workspace] Reloading workspaces...');
        await loadWorkspaces();
        console.log('[Workspace] Reload complete');

        // Step 5: Close modal and clear
        setIsWorkspaceModalOpen(false);
        setWorkspaceName('');
        // alert('Workspace saved successfully!');
        // Show subtle success feedback
        const successToast = document.createElement('div');
        successToast.textContent = '✅ Workspace saved!';
        successToast.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(successToast);
        setTimeout(() => successToast.remove(), 2000);
      } else {
        console.error('[Workspace] Save failed:', res.error);
        throw new Error(res.error || 'Failed to save workspace');
      }
    } catch (err) {
      console.error('[Workspace] Error:', err);
      setError('Failed to save workspace: ' + err.message);
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreWorkspace = async (id) => {
    await handleAction(async () => {
      const res = await sendMessage({ action: 'restoreWorkspace', id });
      if (res.success) alert(`Restored ${res.restored} tabs.`);
    });
  };

  const handleDeleteWorkspace = async (id) => {
    if (!confirm('Delete this workspace?')) return;

    // Delete from local first
    await sendMessage({ action: 'deleteWorkspace', id });

    // Then sync to Supabase if authenticated
    const { workspaces: localWorkspaces } = await chrome.storage.local.get('workspaces');
    await StorageService.saveWorkspaces(localWorkspaces || []);

    // Reload
    await loadWorkspaces();
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'notes':
        return (
          <NotesTab
            notes={notes}
            newNoteContent={newNoteContent}
            setNewNoteContent={setNewNoteContent}
            filter={filter}
            setFilter={setFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            editingNoteId={editingNoteId}
            setEditingNoteId={setEditingNoteId}
            editContent={editContent}
            setEditContent={setEditContent}
            onAddGeneralNote={handleAddGeneralNote}
            onDeleteNote={deleteNote}
            onStartEditing={startEditing}
            onSaveEdit={saveEdit}
            isProcessing={isProcessing}
          />
        );
      case 'workspaces':
        return (
          <WorkspacesTab
            workspaces={workspaces}
            isWorkspaceModalOpen={isWorkspaceModalOpen}
            setIsWorkspaceModalOpen={setIsWorkspaceModalOpen}
            workspaceName={workspaceName}
            setWorkspaceName={setWorkspaceName}
            workspaceFilter={workspaceFilter}
            setWorkspaceFilter={setWorkspaceFilter}
            isProcessing={isProcessing}
            handleSaveWorkspace={handleSaveWorkspace}
            handleRestoreWorkspace={handleRestoreWorkspace}
            handleDeleteWorkspace={handleDeleteWorkspace}
          />
        );
      default:
        return (
          <HomeTab
            error={error}
            isTabsOrganized={isTabsOrganized}
            toggleTabOrganization={toggleTabOrganization}
            isProcessing={isProcessing}
            timeGuard={timeGuard}
            setCurrentTab={setCurrentTab}
            loadTimeGuardAnalytics={loadTimeGuardAnalytics}
            showTimeGuardAnalytics={showTimeGuardAnalytics}
            setShowTimeGuardAnalytics={setShowTimeGuardAnalytics}
            timeGuardData={timeGuardData}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="popup-container loading-screen">
        <Loader2 className="animate-spin" size={40} color="#white" />
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
            <div style={{ width: '100%' }}>
              <div className="auth-form">
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isProcessing} className="input-field" />
                <div className="password-input-wrapper">
                  <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isProcessing} className="input-field" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                <button onClick={() => handleEmailAuth(authMode === 'signup')} className="btn-primary" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : authMode === 'signup' ? <UserPlus size={18} /> : <Mail size={18} />}
                  {authMode === 'signup' ? 'Sign Up' : 'Log In'}
                </button>
              </div>
              <div className="divider">OR</div>
              <button onClick={handleGoogleLogin} className="btn-google" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Users size={18} />} Sign in with Google
              </button>
              <button onClick={handleGuestLogin} className="btn-guest" disabled={isProcessing}>
                <DoorOpen size={18} /> Continue as Guest
              </button>
              <p className="toggle-auth">
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(''); }}>
                  {authMode === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="header" style={{ paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1>🌲 Tab-Van</h1>
        </div>
        <div className="user-info">
          {/* ✅ SYNC BUTTON - Add this block */}
          {!user.is_guest && hasLocalData && (
            <button
              onClick={() => setShowSyncModal(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
              }}
              title="Sync local data to cloud"
            >
              <Cloud size={12} />
              Sync
            </button>
          )}
          <span style={{ fontSize: '11px', opacity: 0.8, marginRight: '8px' }}>
            {user.is_guest ? 'Guest Mode' : user.email?.split('@')[0]}
          </span>
          <button onClick={handleLogout} className="logout-btn"><LogOut size={16} /></button>
        </div>
      </div>

      <div className="nav-tabs">
        <button className={`nav-tab ${currentTab === 'home' ? 'active' : ''}`} onClick={() => setCurrentTab('home')}>
          <Home size={18} /> Home
        </button>
        <button className={`nav-tab ${currentTab === 'notes' ? 'active' : ''}`} onClick={() => setCurrentTab('notes')}>
          <LayoutDashboard size={18} /> Notes
        </button>
        <button className={`nav-tab ${currentTab === 'workspaces' ? 'active' : ''}`} onClick={() => setCurrentTab('workspaces')}>
          <FolderOpen size={18} /> Workspaces
        </button>
      </div>

      {renderTabContent()}

      {showSyncModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowSyncModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '450px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: syncStatus === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                syncStatus === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '24px',
              borderRadius: '16px 16px 0 0',
              textAlign: 'center',
              color: 'white'
            }}>
              {syncStatus === 'success' ? (
                <CheckCircle size={48} strokeWidth={2} style={{ margin: '0 auto 12px' }} />
              ) : syncStatus === 'error' ? (
                <AlertCircle size={48} strokeWidth={2} style={{ margin: '0 auto 12px' }} />
              ) : (
                <Cloud size={48} strokeWidth={2} style={{ margin: '0 auto 12px' }} />
              )}
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                {syncStatus === 'success' ? 'Sync Complete!' :
                  syncStatus === 'error' ? 'Sync Failed' :
                    'Sync Your Data'}
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              {syncStatus === 'idle' && (
                <>
                  <div style={{
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                      What will be synced?
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#64748b', lineHeight: '1.8' }}>
                      <li>📝 All your notes ({notes.length} notes)</li>
                      <li>📁 All workspaces ({workspaces.length} workspaces)</li>
                      <li>⏱ Time guard history</li>
                    </ul>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setShowSyncModal(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#f1f5f9',
                        color: '#64748b',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Later
                    </button>
                    <button
                      onClick={handleSyncToCloud}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Cloud size={18} />
                      Sync Now
                    </button>
                  </div>
                </>
              )}

              {syncStatus === 'syncing' && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Loader2 className="animate-spin" size={40} color="#667eea" style={{ margin: '0 auto 16px' }} />
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Syncing your data to cloud...</p>
                </div>
              )}

              {syncStatus === 'success' && (
                <button
                  onClick={() => setShowSyncModal(false)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              )}

              {syncStatus === 'error' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setSyncStatus('idle');
                      setSyncMessage('');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setShowSyncModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Skip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;