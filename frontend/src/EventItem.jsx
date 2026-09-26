import { useState } from 'react'
import { apiFetch } from './api.js'
import ConfirmModal from './ConfirmModal.jsx'

export default function EventItem({ event, calendars, theme, dateFormat, onGoToCalendar, onDelete, onUpdate }) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [title, setTitle] = useState(event.title)
  const [date, setDate] = useState(event.date)
  const [startTime, setStartTime] = useState(event.start_time || '')
  const [endTime, setEndTime] = useState(event.end_time || '')
  const [notes, setNotes] = useState(event.notes || '')
  const [priority, setPriority] = useState(event.priority || 'medium')
  const [selectedCalIds, setSelectedCalIds] = useState(event.calendar_ids || [])
  const isAllDay = !event.start_time && !event.end_time

  // Skip medium, show explicit clean label badge for high/low priority
  const priorityLabel = event.priority === 'high' ? 'High' : event.priority === 'low' ? 'Low' : ''
  const priorityBg = event.priority === 'high' ? '#d32f2f' : event.priority === 'low' ? '#388e3c' : ''

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    if (!y || !m || !d) return dateStr
    if (dateFormat === 'DD-MM-YYYY') {
      return `${d}-${m}-${y}`
    } else if (dateFormat === 'DD-Mon-YYYY') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = months[parseInt(m, 10) - 1] || m
      return `${d}-${monthName}-${y}`
    }
    return dateStr
  }

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hourNum = parseInt(h, 10)
    if (isNaN(hourNum)) return timeStr
    const meridiem = hourNum >= 12 ? 'PM' : 'AM'
    const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12
    return `${formattedHour}:${m} ${meridiem}`
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await apiFetch(`/events/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          date,
          start_time: startTime || null,
          end_time: endTime || null,
          notes: notes || null,
          priority,
          calendar_ids: selectedCalIds,
          rrule: event.rrule
        })
      })
      if (res.ok) {
        setShowEdit(false)
        if (onUpdate) onUpdate()
      }
    } catch (err) {
      console.error('Failed to update event', err)
    }
  }

  const toggleCalendarSelection = (calId) => {
    setSelectedCalIds((prev) =>
      prev.includes(calId) ? prev.filter((id) => id !== calId) : [...prev, calId]
    )
  }

  const inputStyle = {
    padding: '0.4rem',
    background: theme.bg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontSize: '0.85rem'
  }

  if (showEdit) {
    return (
      <li
        style={{
          background: theme.cardBg,
          color: theme.text,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '0.75rem',
          border: `1px solid ${theme.border}`,
          boxSizing: 'border-box'
        }}
      >
        <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem' }}>Edit Event</h4>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold', color: theme.subText }}>Priority:</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ ...inputStyle, width: 'auto' }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Calendars:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {calendars.map((c) => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedCalIds.includes(c.id)}
                    onChange={() => toggleCalendarSelection(c.id)}
                  />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color }}></span>
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="submit"
              style={{ padding: '0.35rem 0.7rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              style={{ padding: '0.35rem 0.7rem', background: '#888', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li
      className="event-item-row"
      style={{
        background: theme.cardBg,
        color: theme.text,
        padding: '0.85rem 1rem',
        borderRadius: '8px',
        marginBottom: '0.75rem',
        border: `1px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
        gap: '1rem'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flexGrow: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Render color dots for all calendars this event belongs to */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            {event.calendar_ids && event.calendar_ids.length > 0 ? (
              event.calendar_ids.map((calId) => {
                const cal = calendars.find((c) => c.id === calId)
                const dotColor = cal ? cal.color : (event.color || '#2196F3')
                return (
                  <span
                    key={calId}
                    title={cal ? cal.name : ''}
                    style={{ width: '10px', height: '10px', borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }}
                  ></span>
                )
              })
            ) : (
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: event.color || '#2196F3', display: 'inline-block', flexShrink: 0 }}></span>
            )}
          </div>

          {priorityLabel && (
            <span
              style={{
                background: priorityBg,
                color: '#ffffff',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}
            >
              {priorityLabel}
            </span>
          )}

          <span style={{ fontSize: '0.85rem', color: theme.subText, flexShrink: 0, fontWeight: '500' }}>
            {formatDisplayDate(event.date)}
          </span>
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </span>
          {isAllDay ? (
            <span
              style={{
                background: `${theme.primary}20`,
                color: theme.primary,
                border: `1px solid ${theme.primary}40`,
                padding: '0.05rem 0.35rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}
            >
              All day
            </span>
          ) : event.start_time ? (
            <span style={{ fontSize: '0.85rem', color: theme.subText, flexShrink: 0 }}>
              {formatDisplayTime(event.start_time)}
              {event.end_time ? ` - ${formatDisplayTime(event.end_time)}` : ''}
            </span>
          ) : null}
          {event.is_recurring && (
            <span style={{ fontSize: '0.75rem', background: theme.bg, color: theme.subText, padding: '0.1rem 0.4rem', borderRadius: '4px', border: `1px solid ${theme.border}`, flexShrink: 0 }}>
              Recurring
            </span>
          )}
        </div>
        {event.notes && (
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: theme.text, whiteSpace: 'pre-wrap' }}>
            {event.notes}
          </p>
        )}
      </div>
      <div className="event-item-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onGoToCalendar(event.date)}
          title="Jump to date on calendar"
          style={{ padding: '0.35rem 0.6rem', background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          View
        </button>
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          style={{ padding: '0.35rem 0.6rem', background: theme.primary, color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          style={{ padding: '0.35rem 0.6rem', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          Delete
        </button>
      </div>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={event.is_recurring ? "Delete Recurring Event?" : "Delete Event?"}
        message={
          event.is_recurring
            ? "Would you like to delete just this single instance or the entire series?"
            : "Are you sure you want to delete this event?"
        }
        confirmText={event.is_recurring ? "Delete Series" : "Yes, Delete"}
        confirmColor="#d32f2f"
        theme={theme}
        showInstanceOption={event.is_recurring}
        onConfirm={(type) => {
          setShowDeleteConfirm(false)
          onDelete(event.id, type, event.date)
        }}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </li>
  )
}