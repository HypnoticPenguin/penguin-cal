import { useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import ConfirmModal from './ConfirmModal.jsx'

export default function AdminPanel({ currentUserId, theme }) {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', action: null, color: '#4CAF50' })
  
  // Password Reset State
  const [resetTargetUser, setResetTargetUser] = useState(null)
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [resetMsg, setResetMsg] = useState({ text: '', isError: false })

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        setError('Failed to load user list')
      }
    } catch (err) {
      setError('Error fetching user list')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleAdminClick = (userId, username, currentStatus) => {
    const actionText = currentStatus ? 'revoke admin privileges from' : 'grant admin privileges to'
    setModalConfig({
      isOpen: true,
      title: currentStatus ? 'Revoke Admin Privileges?' : 'Grant Admin Privileges?',
      message: `Are you sure you want to ${actionText} "${username}"?`,
      confirmText: currentStatus ? 'Yes, Revoke' : 'Yes, Grant',
      color: '#ffa726',
      action: async () => {
        try {
          const res = await apiFetch(`/admin/users/${userId}/toggle-admin`, { method: 'PATCH' })
          if (res.ok) {
            fetchUsers()
          } else {
            const data = await res.json()
            alert(data.detail || 'Failed to update admin status')
          }
        } catch (err) {
          console.error('Error updating admin status:', err)
        }
        setModalConfig({ isOpen: false })
      }
    })
  }

  const handleDeleteUserClick = (userId, username) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete User Account?',
      message: `Are you sure you want to delete user "${username}"?\nThis will permanently remove their account and all their calendar events.`,
      confirmText: 'Yes, Delete',
      color: '#d32f2f',
      action: async () => {
        try {
          const res = await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' })
          if (res.ok) {
            fetchUsers()
          } else {
            const data = await res.json()
            alert(data.detail || 'Failed to delete user')
          }
        } catch (err) {
          console.error('Error deleting user:', err)
        }
        setModalConfig({ isOpen: false })
      }
    })
  }

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault()
    if (!resetTargetUser || !newAdminPassword) return
    setResetMsg({ text: '', isError: false })

    try {
      const res = await apiFetch(`/admin/users/${resetTargetUser.id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ new_password: newAdminPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setResetMsg({ text: data.message || 'Password updated successfully!', isError: false })
        setTimeout(() => {
          setResetTargetUser(null)
          setNewAdminPassword('')
          setResetMsg({ text: '', isError: false })
        }, 1500)
      } else {
        setResetMsg({ text: data.detail || 'Failed to reset password', isError: true })
      }
    } catch (err) {
      setResetMsg({ text: 'Error connecting to server', isError: true })
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    boxSizing: 'border-box',
    background: theme.bg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: '4px'
  }

  return (
    <div
      style={{
        background: theme.cardBg,
        color: theme.text,
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: `1px solid ${theme.border}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
        overflowX: 'auto'
      }}
    >
      <style>{`
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th, .admin-table td {
          padding: 0.5rem;
        }
        @media (max-width: 600px) {
          .admin-table, .admin-table tbody, .admin-table tr, .admin-table td, .admin-table th {
            display: block;
            width: 100%;
          }
          .admin-table thead {
            display: none;
          }
          .admin-table tr {
            margin-bottom: 1rem;
            border: 1px solid ${theme.border};
            border-radius: 6px;
            padding: 0.5rem;
            background: ${theme.bg};
          }
          .admin-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.4rem 0.2rem;
            border-bottom: 1px dashed ${theme.border};
          }
          .admin-table td:last-child {
            border-bottom: none;
            justify-content: flex-end;
            margin-top: 0.5rem;
            gap: 0.5rem;
            flex-direction: column;
          }
        }
      `}</style>

      <h2 style={{ margin: '0 0 1rem 0', color: theme.primary, fontSize: '1.25rem' }}>
        Admin Panel: User Management
      </h2>
      {error && <p style={{ color: '#ff5252' }}>{error}</p>}

      <table className="admin-table">
        <thead>
          <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
            <th style={{ color: theme.text }}>ID</th>
            <th style={{ color: theme.text }}>Username</th>
            <th style={{ color: theme.text }}>Role</th>
            <th style={{ textAlign: 'right', color: theme.text }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
              <td>
                <span style={{ fontWeight: 'bold', display: 'inline-block', minWidth: '40px' }} className="mobile-label">ID:</span>
                {user.id}
              </td>
              <td>
                <span style={{ fontWeight: 'bold', display: 'none' }} className="mobile-label">User: </span>
                <strong>{user.username}</strong>
                {user.id === currentUserId && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: theme.subText }}>
                    (You)
                  </span>
                )}
              </td>
              <td>
                <span style={{ fontWeight: 'bold', display: 'none' }} className="mobile-label">Role: </span>
                {user.is_admin ? (
                  <span
                    style={{
                      background: theme.primary,
                      color: 'white',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Admin
                  </span>
                ) : (
                  <span
                    style={{
                      background: theme.bg,
                      color: theme.subText,
                      border: `1px solid ${theme.border}`,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}
                  >
                    User
                  </span>
                )}
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setResetTargetUser(user)
                      setNewAdminPassword('')
                      setResetMsg({ text: '', isError: false })
                    }}
                    style={{
                      background: '#ff9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.4rem 0.8rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    Reset Password
                  </button>

                  {user.id !== currentUserId && (
                    <button
                      onClick={() => handleToggleAdminClick(user.id, user.username, user.is_admin)}
                      style={{
                        background: user.is_admin ? '#ffa726' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}
                    >
                      {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                  )}

                  {user.id !== currentUserId && (
                    <button
                      onClick={() => handleDeleteUserClick(user.id, user.username)}
                      style={{
                        background: '#d32f2f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}
                    >
                      Delete Account
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Password Reset Sub-Modal */}
      {resetTargetUser && (
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
            zIndex: 1200
          }}
        >
          <div
            style={{
              background: theme.cardBg,
              color: theme.text,
              padding: '1.5rem',
              borderRadius: '8px',
              maxWidth: '380px',
              width: '100%',
              border: `1px solid ${theme.border}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              boxSizing: 'border-box'
            }}
          >
            <h3 style={{ margin: '0 0 0.75rem 0', color: theme.primary }}>
              Reset Password for {resetTargetUser.username}
            </h3>
            {resetMsg.text && (
              <p style={{ color: resetMsg.isError ? '#ff5252' : '#66bb6a', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {resetMsg.text}
              </p>
            )}
            <form onSubmit={handlePasswordResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                  New Password (min 4 chars)
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  style={{ padding: '0.4rem 0.8rem', background: '#888', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.4rem 0.8rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        confirmColor={modalConfig.color}
        theme={theme}
        onConfirm={modalConfig.action}
        onClose={() => setModalConfig({ isOpen: false })}
      />
    </div>
  )
}