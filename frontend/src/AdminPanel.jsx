import { useEffect, useState } from 'react'
import { apiFetch } from './api.js'

export default function AdminPanel({ currentUserId, theme }) {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

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

  const handleDeleteUser = async (userId, username) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete user "${username}"?\nThis will permanently remove their account and all their calendar events.`
    )
    if (!confirmDelete) return

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
        transition: 'all 0.3s ease'
      }}
    >
      <h2 style={{ margin: '0 0 1rem 0', color: theme.primary }}>
        Admin Panel: User Management
      </h2>
      {error && <p style={{ color: '#ff5252' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
            <th style={{ padding: '0.5rem', color: theme.text }}>ID</th>
            <th style={{ padding: '0.5rem', color: theme.text }}>Username</th>
            <th style={{ padding: '0.5rem', color: theme.text }}>Role</th>
            <th style={{ padding: '0.5rem', textAlign: 'right', color: theme.text }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
              <td style={{ padding: '0.5rem', color: theme.text }}>{user.id}</td>
              <td style={{ padding: '0.5rem', color: theme.text }}>
                <strong>{user.username}</strong>
                {user.id === currentUserId && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: theme.subText }}>
                    (You)
                  </span>
                )}
              </td>
              <td style={{ padding: '0.5rem' }}>
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
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                {user.id !== currentUserId && (
                  <button
                    onClick={() => handleDeleteUser(user.id, user.username)}
                    style={{
                      background: '#d32f2f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.3rem 0.6rem',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Delete Account
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}