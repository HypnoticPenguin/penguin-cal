import { useState, useEffect } from 'react'
import { apiFetch } from './api.js'
import AdminPanel from './AdminPanel.jsx'

export default function AccountSettingsModal({
  isOpen,
  onClose,
  currentUser,
  themeColors,
  onUserUpdated
}) {
  const [displayName, setDisplayName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileMsg, setProfileMsg] = useState({ text: '', isError: false })
  const [passMsg, setPassMsg] = useState({ text: '', isError: false })

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.display_name || currentUser.username || '')
    }
  }, [currentUser])

  useEffect(() => {
    if (!isOpen) {
      setProfileMsg({ text: '', isError: false })
      setPassMsg({ text: '', isError: false })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [isOpen])

  if (!isOpen) return null

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
          maxWidth: '600px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${themeColors.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          boxSizing: 'border-box'
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.25rem' }}>Account Settings</h2>

        {currentUser?.is_admin && (
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${themeColors.border}` }}>
            <AdminPanel currentUserId={currentUser.id} theme={themeColors} />
          </div>
        )}

        {/* Profile Section */}
        <form
          onSubmit={handleProfileSubmit}
          onChange={() => setProfileMsg({ text: '', isError: false })}
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

        {/* Change Password */}
        <form onSubmit={handlePasswordSubmit} onChange={() => setPassMsg({ text: '', isError: false })}>
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
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button
              type="submit"
              style={{ padding: '0.5rem 1rem', background: themeColors.primary, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Update Password
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.5rem 1rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}