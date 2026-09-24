import { useState } from 'react'
import { RRule } from 'rrule'
import { apiFetch, formatDate } from './api.js'
import DeleteModal from './DeleteModal.jsx'

export default function EventItem({ event, dateFormat, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [title, setTitle] = useState(event.title)
  const [date, setDate] = useState(event.date)
  const [startTime, setStartTime] = useState(event.start_time || event.time || '')
  const [endTime, setEndTime] = useState(event.end_time || '')
  const [rruleVal, setRruleVal] = useState(event.rrule || '')

  const handleSave = async () => {
    try {
      const response = await apiFetch(`/events/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          date,
          start_time: startTime || null,
          end_time: endTime || null,
          rrule: rruleVal || null
        }),
      })
      if (response.ok) {
        onUpdate()
        setIsEditing(false)
      }
    } catch (err) {
      console.error('Error updating event:', err)
    }
  }

  const handleDeleteClick = () => {
    const isRecurring = event.is_recurring || Boolean(event.rrule)
    if (isRecurring) {
      setShowDeleteModal(true)
    } else {
      onDelete(event.id, 'all')
    }
  }

  const formatTimeDisplay = () => {
    const s = event.start_time || event.time
    if (!s) return ''
    if (event.end_time) {
      return ` @ ${s} - ${event.end_time}`
    }
    return ` @ ${s}`
  }

  const getRecurrenceText = () => {
    if (!event.rrule) return 'Recurring'

    if (!event.rrule.includes('UNTIL=') && !event.rrule.includes('COUNT=')) {
      return 'Repeats indefinitely'
    }

    try {
      const startTimeVal = event.start_time || event.time
      const dtstart = new Date(startTimeVal ? `${event.date}T${startTimeVal}:00` : `${event.date}T00:00:00`)
      const rule = RRule.fromString(`DTSTART:${dtstart.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nRRULE:${event.rrule}`)
      const allDates = rule.all()
      
      if (allDates.length > 0) {
        const lastDate = allDates[allDates.length - 1]
        const year = lastDate.getUTCFullYear()
        const month = String(lastDate.getUTCMonth() + 1).padStart(2, '0')
        const day = String(lastDate.getUTCDate()).padStart(2, '0')
        const formattedEndDate = formatDate(`${year}-${month}-${day}`, dateFormat)
        return `Ends on ${formattedEndDate}`
      }
    } catch (err) {
      console.error('Failed to parse recurrence end date:', err)
    }

    return 'Repeats indefinitely'
  }

  return (
    <>
      <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #ccc' }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '0.5rem', flexGrow: 1, marginRight: '1rem', flexWrap: 'wrap' }}>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '0.25rem' }} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '0.25rem' }} />
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ padding: '0.25rem' }} title="Start Time" />
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ padding: '0.25rem' }} title="End Time" />
            <select value={rruleVal} onChange={(e) => setRruleVal(e.target.value)} style={{ padding: '0.25rem' }}>
              <option value="">Does not repeat</option>
              <option value="FREQ=DAILY">Daily</option>
              <option value="FREQ=WEEKLY">Weekly</option>
              <option value="FREQ=MONTHLY">Monthly</option>
              <option value="FREQ=YEARLY">Yearly</option>
            </select>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>
              <strong>{formatDate(event.date, dateFormat)}{formatTimeDisplay()}:</strong> {event.title}
            </span>
            {event.is_recurring && (
              <span
                style={{
                  background: 'rgba(33, 150, 243, 0.15)',
                  color: '#2196F3',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                Recurring ({getRecurrenceText()})
              </span>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isEditing ? (
            <>
              <button onClick={handleSave} style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setIsEditing(false)} style={{ background: '#888', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} style={{ background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Edit</button>
              <button onClick={handleDeleteClick} style={{ background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Delete</button>
            </>
          )}
        </div>
      </li>
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleteInstance={() => {
          setShowDeleteModal(false)
          onDelete(event.id, 'single', event.date)
        }}
        onDeleteSeries={() => {
          setShowDeleteModal(false)
          onDelete(event.id, 'all')
        }}
      />
    </>
  )
}