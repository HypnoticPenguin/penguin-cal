import { useState, useEffect } from 'react'
import RecurrenceBuilder from './RecurrenceBuilder.jsx'

export default function EventModal({ isOpen, event, calendars = [], theme, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [originalDate, setOriginalDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedCalIds, setSelectedCalIds] = useState([])
  const [showDateChangeConfirm, setShowDateChangeConfirm] = useState(false)
  
  // Standardized Recurrence States
  const [freq, setFreq] = useState('')
  const [interval, setInterval] = useState(1)
  const [endType, setEndType] = useState('never')
  const [untilDate, setUntilDate] = useState('')
  const [count, setCount] = useState(10)
  const [selectedDays, setSelectedDays] = useState([])
  const [monthDay, setMonthDay] = useState(1)

  useEffect(() => {
    if (event) {
      setTitle(event.title || '')
      setDate(event.date || '')
      setOriginalDate(event.date || '')
      setStartTime(event.start_time || event.time || '')
      setEndTime(event.end_time || '')
      setNotes(event.notes || '')
      setSelectedCalIds(event.calendar_ids || (calendars[0] ? [calendars[0].id] : []))
      setShowDateChangeConfirm(false)
      
      const rruleStr = event.rrule || ''
      if (rruleStr) {
        const parts = rruleStr.split(';').reduce((acc, part) => {
          const [k, v] = part.split('=')
          acc[k] = v
          return acc
        }, {})
        setFreq(parts.FREQ || '')
        setInterval(parts.INTERVAL ? Number(parts.INTERVAL) : 1)
        if (parts.UNTIL) {
          setEndType('until')
          const u = parts.UNTIL
          setUntilDate(`${u.slice(0, 4)}-${u.slice(4, 6)}-${u.slice(6, 8)}`)
        } else if (parts.COUNT) {
          setEndType('count')
          setCount(Number(parts.COUNT))
        } else {
          setEndType('never')
        }
        if (parts.BYDAY) setSelectedDays(parts.BYDAY.split(','))
        if (parts.BYMONTHDAY) setMonthDay(Number(parts.BYMONTHDAY))
      } else {
        setFreq('')
        setInterval(1)
        setEndType('never')
        setUntilDate('')
        setCount(10)
        setSelectedDays([])
      }
    }
  }, [event, calendars])

  if (!isOpen || !event) return null

  const isRecurring = event.is_recurring || Boolean(event.rrule)
  const isAllDay = !startTime && !endTime

  const toggleCalendar = (calId) => {
    setSelectedCalIds((prev) =>
      prev.includes(calId) ? prev.filter((id) => id !== calId) : [...prev, calId]
    )
  }

  const buildRruleString = () => {
    if (!freq) return null
    let parts = [`FREQ=${freq}`]
    if (interval && interval > 1) {
      parts.push(`INTERVAL=${interval}`)
    }
    if (freq === 'WEEKLY' && selectedDays.length > 0) {
      parts.push(`BYDAY=${selectedDays.join(',')}`)
    }
    if (freq === 'MONTHLY') {
      parts.push(`BYMONTHDAY=${monthDay}`)
    }
    if (endType === 'until' && untilDate) {
      const formattedUntil = untilDate.replace(/-/g, '') + 'T235959Z'
      parts.push(`UNTIL=${formattedUntil}`)
    } else if (endType === 'count' && count > 0) {
      parts.push(`COUNT=${count}`)
    }
    return parts.join(';')
  }

  const executeSave = () => {
    onSave(event.id, {
      title,
      date,
      start_time: startTime || null,
      end_time: endTime || null,
      notes: notes || null,
      calendar_ids: selectedCalIds,
      rrule: buildRruleString()
    })
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (selectedCalIds.length === 0) return

    if (isRecurring && date !== originalDate && !showDateChangeConfirm) {
      setShowDateChangeConfirm(true)
      return
    }

    executeSave()
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
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: `1px solid ${activeTheme.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Edit Event</h3>
          {isAllDay && (
            <span
              style={{
                background: 'rgba(76, 175, 80, 0.15)',
                color: '#4CAF50',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              All-Day Event
            </span>
          )}
        </div>

        {showDateChangeConfirm ? (
          <div style={{ background: activeTheme.bg, padding: '1.25rem', borderRadius: '6px', border: `1px solid ${activeTheme.border}`, textAlign: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#ff9800' }}>Shift Recurring Series Start Date?</h4>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              You are changing the start date from <strong>{originalDate}</strong> to <strong>{date}</strong>. This will shift the start date for <strong>all instances</strong> of this recurring event. Do you want to proceed?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowDateChangeConfirm(false)}
                style={{ padding: '0.5rem 1rem', background: '#888', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                No, Keep Original
              </button>
              <button
                type="button"
                onClick={executeSave}
                style={{ padding: '0.5rem 1rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Yes, Change All
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                Date {isRecurring && <span style={{ fontSize: '0.75rem', color: '#ff9800', fontWeight: 'normal' }}>(Editing will shift all series instances)</span>}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '130px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, minWidth: '130px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
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

            <RecurrenceBuilder
              freq={freq}
              setFreq={setFreq}
              interval={interval}
              setInterval={setInterval}
              endType={endType}
              setEndType={setEndType}
              untilDate={untilDate}
              setUntilDate={setUntilDate}
              count={count}
              setCount={setCount}
              selectedDays={selectedDays}
              setSelectedDays={setSelectedDays}
              monthDay={monthDay}
              setMonthDay={setMonthDay}
              theme={activeTheme}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
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
        )}
      </div>
    </div>
  )
}