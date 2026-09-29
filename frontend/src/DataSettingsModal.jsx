import { useState, useEffect } from 'react'
import { apiFetch } from './api.js'
import { themeList } from './themes.js'
import ConfirmModal from './ConfirmModal.jsx'

const COLOR_PALETTE = [
  '#2196F3', '#4CAF50', '#FF9800', '#E91E63', 
  '#9C27B0', '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#F44336'
]

export default function DataSettingsModal({
  isOpen,
  onClose,
  currentUser,
  currentTheme,
  themeColors,
  dateFormat,
  dayStartTime,
  calendars = [],
  activeCalendarIds = [],
  onThemeChange,
  onDateFormatChange,
  onDayStartTimeChange,
  onEventsChanged,
  onCalendarsChanged,
  onToggleCalendar
}) {
  const [cleanupMsg, setCleanupMsg] = useState({ text: '', isError: false })
  const [isCleaning, setIsCleaning] = useState(false)
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false)
  
  const [importCalId, setImportCalId] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  
  // Persistent Import Batches History State
  const [importBatches, setImportBatches] = useState([])
  const [undoBatchTarget, setUndoBatchTarget] = useState(null)

  // Calendar Management States
  const [showCreateCal, setShowCreateCal] = useState(false)
  const [newCalName, setNewCalName] = useState('')
  const [newCalColor, setNewCalColor] = useState('#2196F3')
  const [calMsg, setCalMsg] = useState({ text: '', isError: false })
  const [deleteCalTarget, setDeleteCalTarget] = useState(null)

  // Calendar Editing State
  const [editingCalId, setEditingCalId] = useState(null)
  const [editCalName, setEditCalName] = useState('')
  const [editCalColor, setEditCalColor] = useState('#2196F3')

  // Calendar Sharing States
  const [shareUsers, setShareUsers] = useState([])
  const [selectedShareCalId, setSelectedShareCalId] = useState(null)

  useEffect(() => {
    if (currentUser) {
      fetchImportBatches()
    }
  }, [currentUser])

  useEffect(() => {
    if (calendars.length > 0 && !importCalId) {
      setImportCalId(calendars[0].id)
    }
  }, [calendars])

  useEffect(() => {
    if (!isOpen) {
      setCleanupMsg({ text: '', isError: false })
      setCalMsg({ text: '', isError: false })
      setImportMessage('')
      setShowCleanupConfirm(false)
      setShowCreateCal(false)
      setDeleteCalTarget(null)
      setSelectedShareCalId(null)
      setShareUsers([])
      setUndoBatchTarget(null)
      setEditingCalId(null)
    } else {
      fetchImportBatches()
    }
  }, [isOpen])

  const fetchImportBatches = async () => {
    try {
      const res = await apiFetch('/events/import-batches')
      if (res.ok) {
        const data = await res.json()
        setImportBatches(data)
      }
    } catch (err) {
      console.error('Failed to load import history', err)
    }
  }

  if (!isOpen) return null

  const handleOpenCreateCal = () => {
    if (!showCreateCal) {
      const usedColors = calendars.map(c => (c.color || '').toLowerCase())
      const availableColors = COLOR_PALETTE.filter(c => !usedColors.includes(c.toLowerCase()))
      const pool = availableColors.length > 0 ? availableColors : COLOR_PALETTE
      setNewCalColor(pool[Math.floor(Math.random() * pool.length)])
      setNewCalName('')
    }
    setShowCreateCal(!showCreateCal)
  }

  const handleCreateCalendar = async (e) => {
    e.preventDefault()
    if (!newCalName) return
    setCalMsg({ text: '', isError: false })
    try {
      const res = await apiFetch('/calendars/', {
        method: 'POST',
        body: JSON.stringify({ name: newCalName, color: newCalColor })
      })
      if (res.ok) {
        const newCalData = await res.json()
        setNewCalName('')
        setShowCreateCal(false)
        setCalMsg({ text: 'Calendar created successfully!', isError: false })
        
        if (currentUser && newCalData && newCalData.id) {
          const savedCals = localStorage.getItem(`active_cals_${currentUser.id}`)
          let currentActive = savedCals ? JSON.parse(savedCals) : calendars.map(c => c.id)
          if (!currentActive.includes(newCalData.id)) {
            currentActive.push(newCalData.id)
            localStorage.setItem(`active_cals_${currentUser.id}`, JSON.stringify(currentActive))
          }
        }

        if (onCalendarsChanged) onCalendarsChanged()
      } else {
        const data = await res.json()
        setCalMsg({ text: data.detail || 'Failed to create calendar', isError: true })
      }
    } catch (err) {
      setCalMsg({ text: 'Error creating calendar', isError: true })
    }
  }

  const handleStartEditCal = (cal) => {
    setEditingCalId(cal.id)
    setEditCalName(cal.name)
    setEditCalColor(cal.color || '#2196F3')
    setSelectedShareCalId(null)
  }

  const handleSaveEditCal = async (calId) => {
    if (!editCalName.trim()) return
    setCalMsg({ text: '', isError: false })
    try {
      const res = await apiFetch(`/calendars/${calId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editCalName, color: editCalColor })
      })
      if (res.ok) {
        setEditingCalId(null)
        setCalMsg({ text: 'Calendar updated successfully!', isError: false })
        fetchImportBatches()
        if (onCalendarsChanged) onCalendarsChanged()
        if (onEventsChanged) onEventsChanged()
      } else {
        const data = await res.json()
        setCalMsg({ text: data.detail || 'Failed to update calendar', isError: true })
      }
    } catch (err) {
      setCalMsg({ text: 'Error updating calendar', isError: true })
    }
  }

  const handleDeleteCalendar = async () => {
    if (!deleteCalTarget) return
    setCalMsg({ text: '', isError: false })
    try {
      const res = await apiFetch(`/calendars/${deleteCalTarget.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setCalMsg({ text: `Calendar '${deleteCalTarget.name}' deleted.`, isError: false })
        setDeleteCalTarget(null)
        fetchImportBatches()
        if (onCalendarsChanged) onCalendarsChanged()
        if (onEventsChanged) onEventsChanged()
      } else {
        const data = await res.json()
        setCalMsg({ text: data.detail || 'Failed to delete calendar', isError: true })
        setDeleteCalTarget(null)
      }
    } catch (err) {
      setCalMsg({ text: 'Error deleting calendar', isError: true })
      setDeleteCalTarget(null)
    }
  }

  const fetchShares = async (calId) => {
    if (selectedShareCalId === calId) {
      setSelectedShareCalId(null)
      setShareUsers([])
      return
    }
    setEditingCalId(null)
    try {
      const res = await apiFetch(`/calendars/${calId}/shares`)
      if (res.ok) {
        const data = await res.json()
        setShareUsers(data)
        setSelectedShareCalId(calId)
      }
    } catch (err) {
      console.error('Failed to fetch calendar shares', err)
    }
  }

  const handleToggleShare = async (userId, hasAccess) => {
    if (!selectedShareCalId) return
    try {
      const res = await apiFetch(`/calendars/${selectedShareCalId}/shares/toggle`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, has_access: !hasAccess })
      })
      if (res.ok) {
        setShareUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.user_id === userId ? { ...u, has_access: !hasAccess } : u
          )
        )
      }
    } catch (err) {
      console.error('Failed to toggle share', err)
    }
  }

  const handleExportCalendar = async (cal) => {
    setCalMsg({ text: '', isError: false })
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/events/calendars/${cal.id}/export.ics`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
      if (res.ok) {
        const countHeader = res.headers.get('X-Event-Count') || '0'
        const eventCount = parseInt(countHeader, 10)
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${cal.name.toLowerCase().replace(/\s+/g, '_')}_calendar.ics`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        setCalMsg({ text: `Successfully exported ${eventCount} events.`, isError: false })
      } else {
        setCalMsg({ text: 'Failed to export calendar.', isError: true })
      }
    } catch (err) {
      console.error('Export error:', err)
      setCalMsg({ text: 'Network error during export.', isError: true })
    }
  }

  const handleCleanupPastEvents = async () => {
    setShowCleanupConfirm(false)
    setIsCleaning(true)
    setCleanupMsg({ text: '', isError: false })
    try {
      const res = await apiFetch('/events/cleanup-past', { method: 'POST' })
      let data = {}
      try {
        data = await res.json()
      } catch (parseErr) {
        data = { message: 'Cleanup completed successfully.' }
      }
      if (res.ok) {
        setCleanupMsg({ text: data.message || 'Successfully cleared past events.', isError: false })
        if (typeof onEventsChanged === 'function') onEventsChanged()
      } else {
        setCleanupMsg({ text: data.detail || 'Failed to clean up past events', isError: true })
      }
    } catch (err) {
      setCleanupMsg({ text: 'Error executing cleanup request', isError: true })
    } finally {
      setIsCleaning(false)
    }
  }

  const handleIcsUpload = async (e) => {
    e.preventDefault()
    if (!importFile || !importCalId) return
    setImportLoading(true)
    setImportMessage('')
    const formData = new FormData()
    formData.append('calendar_id', importCalId)
    formData.append('file', importFile)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/events/import-ics', {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setImportMessage(data.message)
        setImportFile(null)
        fetchImportBatches()
        if (typeof onEventsChanged === 'function') onEventsChanged()
      } else {
        setImportMessage(data.detail || 'Import failed.')
      }
    } catch (err) {
      setImportMessage('Network error during import.')
    } finally {
      setImportLoading(false)
    }
  }

  const confirmUndoImport = async () => {
    if (!undoBatchTarget) return
    const batchId = undoBatchTarget.batch_id
    setUndoBatchTarget(null)
    setImportLoading(true)
    setImportMessage('')
    try {
      const res = await apiFetch(`/events/import-ics/undo/${batchId}`, {
        method: 'POST'
      })
      const data = await res.json()
      if (res.ok) {
        setImportMessage(data.message)
        fetchImportBatches()
        if (typeof onEventsChanged === 'function') onEventsChanged()
      } else {
        setImportMessage(data.detail || 'Failed to undo import.')
      }
    } catch (err) {
      setImportMessage('Network error during undo.')
    } finally {
      setImportLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    boxSizing: 'border-box',
    background: themeColors.bg,
    color: themeColors.text,
    border: `1px solid ${themeColors.border}`,
    borderRadius: '4px'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        style={{
          background: themeColors.cardBg,
          color: themeColors.text,
          padding: '1.5rem',
          borderRadius: '8px',
          maxWidth: '850px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${themeColors.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          boxSizing: 'border-box'
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.25rem' }}>Calendar & App Settings</h2>

        {/* Calendar Management & Visibility Section */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${themeColors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>Calendar Management & Visibility</h3>
            <button
              type="button"
              onClick={handleOpenCreateCal}
              style={{ padding: '0.35rem 0.7rem', background: themeColors.primary, color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}
            >
              {showCreateCal ? 'Cancel' : '+ New Calendar'}
            </button>
          </div>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: themeColors.subText }}>
            Create new calendars, or check/uncheck existing ones to show and hide them on your main calendar view. You can also manage sharing, edits, exports, and deletes below.
          </p>

          {calMsg.text && (
            <p style={{ color: calMsg.isError ? '#ff5252' : '#66bb6a', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              {calMsg.text}
            </p>
          )}

          {showCreateCal && (
            <form onSubmit={handleCreateCalendar} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem', background: themeColors.bg, padding: '0.75rem', borderRadius: '6px', border: `1px solid ${themeColors.border}` }}>
              <input
                type="text"
                placeholder="Calendar Name"
                value={newCalName}
                onChange={(e) => setNewCalName(e.target.value)}
                required
                style={{ ...inputStyle, flexGrow: 1, minWidth: '150px', background: themeColors.cardBg }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <span>Color:</span>
                <input
                  type="color"
                  value={newCalColor}
                  onChange={(e) => setNewCalColor(e.target.value)}
                  style={{ border: 'none', width: '32px', height: '32px', cursor: 'pointer', background: 'transparent' }}
                />
              </div>
              <button
                type="submit"
                style={{ padding: '0.4rem 0.8rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}
              >
                Create
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {calendars.map((cal) => {
              const isVisible = activeCalendarIds.includes(cal.id)
              const isEditing = editingCalId === cal.id

              return (
                <div
                  key={cal.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: themeColors.bg,
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: `1px solid ${themeColors.border}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexGrow: 1 }}>
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => onToggleCalendar(cal.id)}
                        title="Toggle calendar visibility"
                        style={{ cursor: 'pointer' }}
                      />

                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexGrow: 1, flexWrap: 'wrap' }}>
                          <input
                            type="color"
                            value={editCalColor}
                            onChange={(e) => setEditCalColor(e.target.value)}
                            style={{ border: 'none', width: '28px', height: '28px', cursor: 'pointer', background: 'transparent' }}
                          />
                          <input
                            type="text"
                            value={editCalName}
                            onChange={(e) => setEditCalName(e.target.value)}
                            style={{ ...inputStyle, padding: '0.25rem 0.5rem', fontSize: '0.85rem', flexGrow: 1, minWidth: '120px' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditCal(cal.id)}
                            style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCalId(null)}
                            style={{ background: '#888', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: cal.color }}></span>
                          <span style={{ fontWeight: isVisible ? 'bold' : 'normal', fontSize: '0.9rem' }}>{cal.name}</span>
                          {cal.is_default && (
                            <span style={{ fontSize: '0.75rem', background: themeColors.cardBg, color: themeColors.subText, padding: '0.1rem 0.4rem', borderRadius: '4px', border: `1px solid ${themeColors.border}` }}>
                              Personal
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        {!cal.is_default && cal.is_owner && (
                          <button
                            type="button"
                            onClick={() => fetchShares(cal.id)}
                            style={{ background: themeColors.primary, color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
                          >
                            {selectedShareCalId === cal.id ? 'Close' : 'Share'}
                          </button>
                        )}
                        {cal.is_owner && (
                          <button
                            type="button"
                            onClick={() => handleStartEditCal(cal)}
                            style={{ background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleExportCalendar(cal)}
                          style={{ background: '#607d8b', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
                        >
                          Export
                        </button>
                        {!cal.is_default && cal.is_owner && (
                          <button
                            type="button"
                            onClick={() => setDeleteCalTarget(cal)}
                            style={{ background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedShareCalId === cal.id && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px dashed ${themeColors.border}` }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>
                        Share Calendar with Users:
                      </span>
                      {shareUsers.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: themeColors.subText, margin: 0 }}>No other users available to share with.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {shareUsers.map((u) => (
                            <label key={u.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={u.has_access}
                                onChange={() => handleToggleShare(u.user_id, u.has_access)}
                              />
                              {u.display_name} <span style={{ color: themeColors.subText }}>(@{u.username})</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Appearance Section */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${themeColors.border}` }}>
          <h3 style={{ margin: '0 0 0.75rem 0' }}>Appearance</h3>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Calendar Theme</label>
            <select
              value={currentTheme}
              onChange={(e) => onThemeChange(e.target.value)}
              style={inputStyle}
            >
              {themeList.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Date Format</label>
            <select
              value={dateFormat}
              onChange={(e) => onDateFormatChange(e.target.value)}
              style={inputStyle}
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-24)</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 24-09-2026)</option>
              <option value="DD-Mon-YYYY">DD-Mon-YYYY (e.g. 24-Sep-2026)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Day/Week View Start Time</label>
            <select
              value={dayStartTime}
              onChange={(e) => onDayStartTimeChange(e.target.value)}
              style={inputStyle}
            >
              <option value="00:00:00">12:00 AM (Midnight)</option>
              <option value="06:00:00">6:00 AM</option>
              <option value="07:00:00">7:00 AM</option>
              <option value="08:00:00">8:00 AM</option>
              <option value="09:00:00">9:00 AM</option>
            </select>
          </div>
        </div>

        {/* Data Management & Imports */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${themeColors.border}` }}>
          <h3 style={{ margin: '0 0 0.75rem 0' }}>Data Management & Imports</h3>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Import Calendar (.ics)</h4>
            {importMessage && (
              <div style={{ background: `${themeColors.primary}15`, border: `1px solid ${themeColors.primary}40`, padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: themeColors.text }}>{importMessage}</span>
              </div>
            )}
            <form onSubmit={handleIcsUpload} onChange={() => setImportMessage('')} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Select .ics File</label>
                <input
                  type="file"
                  accept=".ics"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  required
                  style={{ width: '100%', color: themeColors.text, fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Target Calendar</label>
                <select
                  value={importCalId}
                  onChange={(e) => setImportCalId(e.target.value)}
                  style={inputStyle}
                >
                  {calendars.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={importLoading}
                style={{ padding: '0.4rem 0.8rem', background: themeColors.primary, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start', fontSize: '0.85rem' }}
              >
                {importLoading ? 'Importing...' : 'Import Events'}
              </button>
            </form>

            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: `1px dashed ${themeColors.border}` }}>
              <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: themeColors.subText }}>Recent Imports & Rollbacks</h5>
              {importBatches.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: themeColors.subText, margin: 0 }}>No past import logs found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {importBatches.map((batch) => (
                    <div
                      key={batch.batch_id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: themeColors.bg,
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        border: `1px solid ${themeColors.border}`,
                        fontSize: '0.8rem',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong>{batch.filename}</strong> ({batch.event_count} events)<br />
                        <span style={{ fontSize: '0.7rem', color: themeColors.subText }}>
                          To: {batch.calendar_name} • {batch.imported_at}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUndoBatchTarget(batch)}
                        disabled={importLoading}
                        style={{ padding: '0.2rem 0.5rem', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}
                      >
                        Rollback
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ paddingTop: '0.75rem', borderTop: `1px dashed ${themeColors.border}` }}>
            <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.95rem' }}>Clear Past Events</h4>
            <p style={{ fontSize: '0.80rem', color: themeColors.subText, marginBottom: '0.75rem' }}>
              Remove old one-off events that occurred before today. Recurring events and future entries are safe.
            </p>
            {cleanupMsg.text && (
              <p style={{ color: cleanupMsg.isError ? '#ff5252' : '#66bb6a', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {cleanupMsg.text}
              </p>
            )}
            <button
              type="button"
              disabled={isCleaning}
              onClick={() => setShowCleanupConfirm(true)}
              style={{ padding: '0.4rem 0.8rem', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              {isCleaning ? 'Cleaning...' : 'Clear Past Events'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(undoBatchTarget)}
        title="Rollback Import Batch?"
        message={`Are you sure you want to remove all ${undoBatchTarget?.event_count || ''} events imported from '${undoBatchTarget?.filename}'? This cannot be undone.`}
        confirmText="Yes, Rollback"
        confirmColor="#d32f2f"
        theme={themeColors}
        onConfirm={confirmUndoImport}
        onClose={() => setUndoBatchTarget(null)}
      />

      <ConfirmModal
        isOpen={showCleanupConfirm}
        title="Clear Past Non-Recurring Events?"
        message="Are you sure you want to delete all past non-recurring events? This cannot be undone."
        confirmText="Yes, Clear"
        confirmColor="#d32f2f"
        theme={themeColors}
        onConfirm={handleCleanupPastEvents}
        onClose={() => setShowCleanupConfirm(false)}
      />

      <ConfirmModal
        isOpen={Boolean(deleteCalTarget)}
        title="Delete Calendar?"
        message={`Are you sure you want to delete calendar '${deleteCalTarget?.name}'? All associated events linked only to this calendar will be removed.`}
        confirmText="Yes, Delete"
        confirmColor="#d32f2f"
        theme={themeColors}
        onConfirm={handleDeleteCalendar}
        onClose={() => setDeleteCalTarget(null)}
      />
    </div>
  )
}