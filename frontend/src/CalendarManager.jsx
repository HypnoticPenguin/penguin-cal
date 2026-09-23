import { useState } from 'react'
import { apiFetch } from './api.js'

export default function CalendarManager({
  calendars,
  activeCalendarIds,
  theme,
  onToggleCalendar,
  onCalendarCreated
}) {
  const [newCalName, setNewCalName] = useState('')
  const [expandedCalId, setExpandedCalId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#2196F3')
  const [sharesMap, setSharesMap] = useState({})

  const handleCreateCalendar = async (e) => {
    e.preventDefault()
    if (!newCalName) return

    try {
      const res = await apiFetch('/calendars', {
        method: 'POST',
        body: JSON.stringify({ name: newCalName, color: '#2196F3' })
      })

      if (res.ok) {
        setNewCalName('')
        onCalendarCreated()
      }
    } catch (err) {
      console.error('Error creating calendar:', err)
    }
  }

  const fetchShares = async (calId) => {
    try {
      const res = await apiFetch(`/calendars/${calId}/shares`)
      if (res.ok) {
        const data = await res.json()
        setSharesMap((prev) => ({ ...prev, [calId]: data }))
      }
    } catch (err) {
      console.error('Failed to fetch calendar shares:', err)
    }
  }

  const handleToggleSettings = (cal) => {
    if (expandedCalId === cal.id) {
      setExpandedCalId(null)
    } else {
      setExpandedCalId(cal.id)
      setEditName(cal.name)
      setEditColor(cal.color || '#2196F3')
      if (!cal.is_default) {
        fetchShares(cal.id)
      }
    }
  }

  const handleSaveCalendarSettings = async (calId) => {
    try {
      const res = await apiFetch(`/calendars/${calId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName, color: editColor })
      })

      if (res.ok) {
        onCalendarCreated()
      }
    } catch (err) {
      console.error('Error updating calendar:', err)
    }
  }

  const handleCheckboxToggle = async (calId, userId, currentAccess) => {
    const newAccessStatus = !currentAccess

    setSharesMap((prev) => ({
      ...prev,
      [calId]: (prev[calId] || []).map((u) =>
        u.user_id === userId ? { ...u, has_access: newAccessStatus } : u
      )
    }))

    try {
      const res = await apiFetch(`/calendars/${calId}/shares/toggle`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, has_access: newAccessStatus })
      })

      if (!res.ok) {
        fetchShares(calId)
      }
    } catch (err) {
      console.error('Error toggling share:', err)
      fetchShares(calId)
    }
  }

  return (
    <div
      style={{
        background: theme.cardBg,
        color: theme.text,
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        border: `1px solid ${theme.border}`,
        transition: 'all 0.3s ease'
      }}
    >
      <h3 style={{ marginTop: 0 }}>My Calendars</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {calendars.map((cal) => (
          <div
            key={cal.id}
            style={{
              background: theme.bg,
              padding: '0.75rem',
              borderRadius: '4px',
              borderLeft: `6px solid ${cal.color}`,
              borderTop: `1px solid ${theme.border}`,
              borderRight: `1px solid ${theme.border}`,
              borderBottom: `1px solid ${theme.border}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={activeCalendarIds.includes(cal.id)}
                  onChange={() => onToggleCalendar(cal.id)}
                />
                {cal.name}
              </label>

              {cal.is_owner ? (
                <button
                  type="button"
                  onClick={() => handleToggleSettings(cal)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    background: expandedCalId === cal.id ? '#1976D2' : theme.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {expandedCalId === cal.id ? 'Close Settings' : 'Calendar Settings'}
                </button>
              ) : (
                <span style={{ fontSize: '0.75rem', color: theme.subText, fontStyle: 'italic' }}>Shared with you</span>
              )}
            </div>

            {cal.is_owner && expandedCalId === cal.id && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: cal.is_default ? 0 : '1rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Display Name:</span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ padding: '0.3rem', fontSize: '0.85rem', flexGrow: 1, background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}` }}
                  />

                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>Color:</span>
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    style={{ height: '30px', width: '36px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                  />

                  <button
                    type="button"
                    onClick={() => handleSaveCalendarSettings(cal.id)}
                    style={{
                      padding: '0.3rem 0.7rem',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Save Settings
                  </button>
                </div>

                {cal.is_default ? (
                  <p style={{ fontSize: '0.8rem', color: theme.subText, fontStyle: 'italic', margin: '0.5rem 0 0 0' }}>
                    Note: Your default personal calendar is private and cannot be shared with other users.
                  </p>
                ) : (
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                      Shared Access:
                    </span>

                    {sharesMap[cal.id] && sharesMap[cal.id].length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {sharesMap[cal.id].map((u) => (
                          <label
                            key={u.user_id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.5rem',
                              background: u.has_access ? theme.accentBg : theme.cardBg,
                              border: `1px solid ${theme.border}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={u.has_access}
                              onChange={() => handleCheckboxToggle(cal.id, u.user_id, u.has_access)}
                            />
                            {u.username}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: theme.subText, margin: 0 }}>No other registered users found.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleCreateCalendar} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="New calendar name"
          value={newCalName}
          onChange={(e) => setNewCalName(e.target.value)}
          required
          style={{ padding: '0.4rem', flexGrow: 1, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
        />
        <button
          type="submit"
          style={{ padding: '0.4rem 0.8rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Add Calendar
        </button>
      </form>
    </div>
  )
}