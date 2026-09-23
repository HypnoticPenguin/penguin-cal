import { useState } from 'react'
import { apiFetch } from './api.js'
import { themeList } from './themes.js'
import AdminPanel from './AdminPanel.jsx'

export default function UserSettingsModal({
  isOpen,
  onClose,
  currentUser,
  currentTheme,
  themeColors,
  onThemeChange
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState({ text: '', isError: false })

  if (!isOpen) return null

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setMsg({ text: '', isError: false })

    if (newPassword !== confirmPassword) {
      setMsg({ text: 'New passwords do not match.', isError: true })
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
        setMsg({ text: 'Password updated successfully!', isError: false })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setMsg({ text: data.detail || 'Failed to update password', isError: true })
      }
    } catch (err) {
      setMsg({ text: 'Error updating password', isError: true })
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.25rem' }}>Account & App Settings</h2>

        {/* 1. Admin Management Panel (Admin Only) */}
        {currentUser?.is_admin && (
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${themeColors.border}` }}>
            <AdminPanel currentUserId={currentUser.id} theme={themeColors} />
          </div>
        )}

        {/* 2. Theme Selection */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${themeColors.border}` }}>
          <h3 style={{ margin: '0 0 0.75rem 0' }}>Appearance</h3>
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

        {/* 3. Password Reset Form */}
        <form onSubmit={handlePasswordSubmit}>
          <h3 style={{ margin: '0 0 0.75rem 0' }}>Change Password</h3>

          {msg.text && (
            <p style={{ color: msg.isError ? '#ff5252' : '#66bb6a', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              {msg.text}
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

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
    </div>
  )
}