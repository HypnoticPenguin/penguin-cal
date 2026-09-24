import { useState } from 'react'
import { RRule } from 'rrule'
import { apiFetch, formatDate } from './api.js'
import DeleteModal from './DeleteModal.jsx'
import RecurrenceBuilder from './RecurrenceBuilder.jsx'

export default function EventItem({ event, theme, dateFormat, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [title, setTitle] = useState(event.title)
  const [date, setDate] = useState(event.date)
  const [startTime, setStartTime] = useState(event.start_time || event.time || '')
  const [endTime, setEndTime] = useState(event.end_time || '')
  const [notes, setNotes] = useState(event.notes || '')

  // Standardized Recurrence States for List Editing
  const [freq, setFreq] = useState('')
  const [interval, setInterval] = useState(1)
  const [endType, setEndType] = useState('never')
  const [untilDate, setUntilDate] = useState('')
  const [count, setCount] = useState(10)
  const [selectedDays, setSelectedDays] = useState([])
  const [monthDay, setMonthDay] = useState(1)

  const isRecurring = event.is_recurring || Boolean(event.rrule)

  const handleStartEdit = () => {
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
    setIsEditing(true)
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

  const handleSave = async () => {
    try {
      const response = await apiFetch(`/events/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          date,
          start_time: startTime || null,
          end_time: endTime || null,
          notes: notes || null,
          rrule: buildRruleString()
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
      <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: `1px solid ${theme.border}`, gap: '1rem', flexWrap: 'wrap' }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1, marginRight: '1rem' }}>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '0.4rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '0.4rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px' }} />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ padding: '0.4rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px' }} title="Start Time" />
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ padding: '0.4rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px' }} title="End Time" />
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." rows={2} style={{ padding: '0.4rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px', resize: 'vertical' }} />
            
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
              theme={theme}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexGrow: 1, minWidth: '200px' }}>
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
            {event.notes && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: theme.subText, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {event.notes}
              </p>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isEditing ? (
            <>
              <button onClick={handleSave} style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>Save</button>
              <button onClick={() => setIsEditing(false)} style={{ background: '#888', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={handleStartEdit} style={{ background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>Edit</button>
              <button onClick={handleDeleteClick} style={{ background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
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