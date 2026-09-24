import { useState } from 'react'
import { apiFetch } from './api.js'

export default function CalendarManager({ calendars, activeCalendarIds, theme, onToggleCalendar, onCalendarCreated }) {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2196F3')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name) return
    setIsSubmitting(true)
    try {
      const res = await apiFetch('/calendars', {
        method: 'POST',
        body: JSON.stringify({ name, color })
      })
      if (res.ok) {
        setName('')
        setColor('#2196F3')
        setShowCreate(false)
        if (onCalendarCreated) onCalendarCreated()
      }
    } catch (err) {
      console.error('Failed to create calendar:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputStyle = {
    padding: '0.4rem 0.6rem',
    background: theme.bg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: '4px',
    boxSizing: 'border-box'
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
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem' }}>Calendars</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: theme.subText }}>
            Check boxes to toggle calendar visibility on your views.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          style={{ padding: '0.35rem 0.7rem', background: theme.primary, color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}
        >
          {showCreate ? 'Cancel' : '+ New Calendar'}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: showCreate ? '1rem' : '0' }}>
        {calendars.map((cal) => {
          const isVisible = activeCalendarIds.includes(cal.id)
          return (
            <label
              key={cal.id}
              title="Click to toggle calendar visibility"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
                background: isVisible ? `${cal.color}15` : theme.bg,
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                border: `1px solid ${isVisible ? cal.color : theme.border}`,
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => onToggleCalendar(cal.id)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cal.color }}></span>
              <span style={{ fontWeight: isVisible ? 'bold' : 'normal' }}>{cal.name}</span>
              <span style={{ fontSize: '0.7rem', color: theme.subText, marginLeft: '2px' }}>
                ({isVisible ? 'Visible' : 'Hidden'})
              </span>
            </label>
          )
        })}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '0.75rem', borderTop: `1px dashed ${theme.border}` }}>
          <input
            type="text"
            placeholder="Calendar Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ ...inputStyle, flexGrow: 1, minWidth: '150px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <span>Color:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ border: 'none', width: '32px', height: '32px', cursor: 'pointer', background: 'transparent' }}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ padding: '0.4rem 0.8rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            {isSubmitting ? 'Creating...' : 'Create Calendar'}
          </button>
        </form>
      )}
    </div>
  )
}