import { useState, useEffect } from 'react'
import { apiFetch } from './api.js'
import { themeList } from './themes.js'
import AdminPanel from './AdminPanel.jsx'
import ConfirmModal from './ConfirmModal.jsx'

export default function UserSettingsModal({
  isOpen,
  onClose,
  currentUser,
  currentTheme,
  themeColors,
  dateFormat,
  calendars = [],
  onThemeChange,
  onDateFormatChange,
  onUserUpdated,
  onEventsChanged
}) {
  const [displayName, setDisplayName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileMsg, setProfileMsg] = useState({ text: '', isError: false })
  const [passMsg, setPassMsg] = useState({ text: '', isError: false })
  const [cleanupMsg, setCleanupMsg] = useState({ text: '', isError: false })
  const [isCleaning, setIsCleaning] = useState(false)
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false)

  // ICS Import States
  const [importCalId, setImportCalId] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importMessage, setImportMessage] = useState('')

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.display_name || currentUser.username || '')
    }
  }, [currentUser])

  useEffect(() => {
    if (calendars.length > 0 && !importCalId) {
      setImportCalId(calendars[0].id)
    }
  }, [calendars])

  useEffect(() => {
    if (!isOpen) {
      setProfileMsg({ text: '', isError: false })
      setPassMsg({ text: '', isError: false })
      setCleanupMsg({ text: '', isError: false })
      setImportMessage('')
      setShowCleanupConfirm(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const clearMessagesExcept = (activeSection) => {
    if (activeSection !== 'profile') setProfileMsg({ text: '', isError: false })
    if (activeSection !== 'pass') setPassMsg({ text: '', isError: false })
    if (activeSection !== 'cleanup') setCleanupMsg({ text: '', isError: false })
    if (activeSection !== 'import') setImportMessage('')
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileMsg({ text: '', isError: false })
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ display_name: displayName })
      })
      const data = await res.json()
      if (res.ok) {
        setProfileMsg({ text: 'Display name updated successfully!', isError: false })
        if (onUserUpdated) onUserUpdated()
      } else {
        setProfileMsg({ text: data.detail || 'Failed to update display name', isError: true })
      }
    } catch (err) {
      setProfileMsg({ text: 'Error updating display name', isError: true })
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPassMsg({ text: '', isError: false })
    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'New passwords do not match.', isError: true })
      return
    }
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      })
      const data = await res.json()
      if (res.ok) {
        setPassMsg({ text: 'Password updated successfully!', isError: false })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPassMsg({ text: data.detail || 'Failed to update password', isError: true })
      }
    } catch (err) {
      setPassMsg({ text: 'Error updating password', isError: true })
    }
  }

  const handleCleanupPastEvents = async () => {
    setShowCleanupConfirm(false)
    setIsCleaning(true)
    clearMessagesExcept('cleanup')
    try {
      const res = await apiFetch('/events/cleanup-past', {
        method: 'POST'
      })
      
      let data = {}
      try {
        data = await res.json()
      } catch (parseErr) {
        data = { message: 'Cleanup completed successfully.' }
      }

      if (res.ok) {
        setCleanupMsg({ text: data.message || 'Successfully cleared past events.', isError: false })
        if (typeof onEventsChanged === 'function') {
          onEventsChanged()
        }
      } else {
        setCleanupMsg({ text: data.detail || 'Failed to clean up past events', isError: true })
      }
    } catch (err) {
      console.error('Cleanup error:', err)
      setCleanupMsg({ text: 'Error executing cleanup request', isError: true })
    } finally {
      setIsCleaning(false)
    }
  }

  const handleIcsUpload = async (e) => {
    e.preventDefault()
    if (!importFile || !importCalId) return
    setImportLoading(true)
    clearMessagesExcept('import')
    const formData = new FormData()
    formData.append('calendar_id', importCalId)
    formData.append('file', importFile)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/events/import-ics', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setImportMessage(data.message)
        setImportFile(null)
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
          maxWidth: '650px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${themeColors.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          boxSizing: 'border-box'
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.25rem' }}>Account & App Settings</h2>
        
        {currentUser?.is_admin && (
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${themeColors.border}` }}>
            <AdminPanel currentUserId={currentUser.id} theme={themeColors} />
          </div>
        )}

        <form 
          onSubmit={handleProfileSubmit} 
          onChange={() => clearMessagesExcept('profile')}
          style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${themeColors.border}` }}
        >
          <h3 style={{ margin: '0 0 0.75rem 0' }}>Profile</h3>
          {profileMsg.text && (
            <p style={{ color: profileMsg.isError ? '#ff5252' : '#66bb6a', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              {profileMsg.text}
            </p>
          )}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            style={{ padding: '0.4rem 0.8rem', background: themeColors.primary, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Save Profile
          </button>
        </form>

        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${themeColors.border}` }}>
          <h3 style={{ margin: '0 0 0.75rem 0' }}>Appearance</h3>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Calendar Theme</label>
            <select
              value={currentTheme}
              onChange={(e) => {
                clearMessagesExcept('appearance')
                onThemeChange(e.target.value)
              }}
              style={inputStyle}
            >
              {themeList.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Date Format</label>
            <select
              value={dateFormat}
              onChange={(e) => {
                clearMessagesExcept('appearance')
                onDateFormatChange(e.target.value)
              }}
              style={inputStyle}
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-24)</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 24-09-2026)</option>
              <option value="DD-Mon-YYYY">DD-Mon-YYYY (e.g. 24-Sep-2026)</option>
            </select>
          </div>
        </div>

        {/* Data Management / ICS Import / Cleanup Section */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${themeColors.border}` }}>
          <h3 style={{ margin: '0 0 0.75rem 0' }}>Data Management & Imports</h3>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Import Calendar (.ics)</h4>
            {importMessage && <p style={{ fontSize: '0.85rem', color: themeColors.primary, marginBottom: '0.5rem' }}>{importMessage}</p>}
            <form onSubmit={handleIcsUpload} onChange={() => clearMessagesExcept('import')} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
              <button
                type="submit"
                disabled={importLoading}
                style={{ padding: '0.4rem 0.8rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start', fontSize: '0.85rem' }}
              >
                {importLoading ? 'Importing...' : 'Import Events'}
              </button>
            </form>
          </div>

          <div style={{ paddingTop: '0.75rem', borderTop: `1px dashed ${themeColors.border}` }} onClick={() => clearMessagesExcept('cleanup')}>
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

        <form onSubmit={handlePasswordSubmit} onChange={() => clearMessagesExcept('pass')}>
          <h3 style={{ margin: '0 0 0.75rem 0' }}>Change Password</h3>
          {passMsg.text && (
            <p style={{ color: passMsg.isError ? '#ff5252' : '#66bb6a', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              {passMsg.text}
            </p>
          )}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.5rem 1rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Close
            </button>
            <button
              type="submit"
              style={{ padding: '0.5rem 1rem', background: themeColors.primary, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

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
    </div>
  )
}