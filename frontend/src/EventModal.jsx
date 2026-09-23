import { useState, useEffect } from 'react'

export default function EventModal({ isOpen, event, calendars = [], theme, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [selectedCalIds, setSelectedCalIds] = useState([])
  const [rruleVal, setRruleVal] = useState('')

  useEffect(() => {
    if (event) {
      setTitle(event.title || '')
      setDate(event.date || '')
      setStartTime(event.start_time || event.time || '')
      setEndTime(event.end_time || '')
      setSelectedCalIds(event.calendar_ids || (calendars[0] ? [calendars[0].id] : []))
      setRruleVal(event.rrule || '')
    }
  }, [event, calendars])

  if (!isOpen || !event) return null

  const isRecurring = event.is_recurring || Boolean(event.rrule)

  const toggleCalendar = (calId) => {
    setSelectedCalIds((prev) =>
      prev.includes(calId) ? prev.filter((id) => id !== calId) : [...prev, calId]
    )
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (selectedCalIds.length === 0) return
    onSave(event.id, {
      title,
      date,
      start_time: startTime || null,
      end_time: endTime || null,
      calendar_ids: selectedCalIds,
      rrule: rruleVal || null
    })
  }

  const activeTheme = theme || {
    bg: '#f4f6f8',
    cardBg: '#ffffff',
    text: '#333333',
    border: '#e0e0e0',
    primary: '#2196F3'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    boxSizing: 'border-box',
    background: activeTheme.bg,
    color: activeTheme.text,
    border: `1px solid ${activeTheme.border}`,
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
          background: activeTheme.cardBg,
          color: activeTheme.text,
          padding: '1.5rem',
          borderRadius: '8px',
          maxWidth: '450px',
          width: '100%',
          border: `1px solid ${activeTheme.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}
      >
        <h3 style={{ marginTop: 0 }}>Edit Event</h3>
        <form onSubmit={handleFormSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Calendars</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {calendars.map((c) => (
                <label
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: activeTheme.bg,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    border: `1px solid ${activeTheme.border}`
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCalIds.includes(c.id)}
                    onChange={() => toggleCalendar(c.id)}
                  />
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: c.color }}></span>
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Recurrence</label>
            <select
              value={rruleVal}
              onChange={(e) => setRruleVal(e.target.value)}
              style={inputStyle}
            >
              <option value="">Does not repeat</option>
              <option value="FREQ=DAILY">Daily</option>
              <option value="FREQ=WEEKLY">Weekly</option>
              <option value="FREQ=MONTHLY">Monthly</option>
              <option value="FREQ=YEARLY">Yearly</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="submit"
              disabled={selectedCalIds.length === 0}
              style={{
                padding: '0.6rem',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Save Changes
            </button>
            {isRecurring ? (
              <>
                <button
                  type="button"
                  onClick={() => onDelete(event.id, 'single', event.date)}
                  style={{
                    padding: '0.6rem',
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Delete Only This Instance
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(event.id, 'all')}
                  style={{
                    padding: '0.6rem',
                    background: '#d32f2f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Delete Entire Series
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onDelete(event.id, 'all')}
                style={{
                  padding: '0.6rem',
                  background: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Delete Event
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem',
                background: activeTheme.bg,
                color: activeTheme.text,
                border: `1px solid ${activeTheme.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}