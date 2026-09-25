import { useState } from 'react'
import { RRule } from 'rrule'
import { apiFetch, formatDate } from './api.js'
import DeleteModal from './DeleteModal.jsx'
import RecurrenceBuilder from './RecurrenceBuilder.jsx'
import { useEventTime } from './hooks/useEventTime.js'
import { buildRruleString } from './utils/recurrence.js'

export default function EventItem({ event, calendars = [], theme, dateFormat, onDelete, onUpdate, onGoToCalendar }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [title, setTitle] = useState(event.title)
  const [date, setDate] = useState(event.date)
  const [notes, setNotes] = useState(event.notes || '')
  const [priority, setPriority] = useState(event.priority || 'medium')
  
  const {
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    activePreset,
    applyPreset,
    validateTimes,
    timeError
  } = useEventTime()

  const [freq, setFreq] = useState('')
  const [interval, setInterval] = useState(1)
  const [endType, setEndType] = useState('never')
  const [untilDate, setUntilDate] = useState('')
  const [count, setCount] = useState(10)
  const [selectedDays, setSelectedDays] = useState([])
  const [monthDay, setMonthDay] = useState(1)

  const isRecurring = event.is_recurring || Boolean(event.rrule)
  const assignedCalendars = calendars.filter(
    (c) => event.calendar_ids && event.calendar_ids.includes(c.id)
  )

  const handleStartEdit = () => {
    setStartTime(event.start_time || event.time || '')
    setEndTime(event.end_time || '')
    setPriority(event.priority || 'medium')
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

  const handleSave = async () => {
    if (!validateTimes()) return
    try {
      const response = await apiFetch(`/events/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          date,
          start_time: startTime || null,
          end_time: endTime || null,
          notes: notes || null,
          priority,
          rrule: buildRruleString({ freq, interval, endType, untilDate, count, selectedDays, monthDay })
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
    if (!s) return ' (All-day)'
    if (event.end_time) {
      return ` @ ${s} - ${event.end_time}`
    }
    return ` @ ${s}`
  }

  const getRecurrenceText = () => {
    if (!event.rrule) return 'Recurring'
    const freqMatch = event.rrule.match(/FREQ=([A-Z]+)/)
    let freqLabel = 'Recurring'
    if (freqMatch) {
      const rawFreq = freqMatch[1].toLowerCase()
      freqLabel = rawFreq.charAt(0).toUpperCase() + rawFreq.slice(1)
    }
    if (!event.rrule.includes('UNTIL=') && !event.rrule.includes('COUNT=')) {
      return `${freqLabel}, repeats indefinitely`
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
        return `${freqLabel}, ends on ${formattedEndDate}`
      }
    } catch (err) {
      console.error('Failed to parse recurrence end date:', err)
    }
    return freqLabel
  }

  return (
    <>
      <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: `1px solid ${theme.border}`, gap: '1rem', flexWrap: 'wrap' }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1, marginRight: '1rem' }}>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '0.4rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px' }} />
            
            {timeError && (
              <div style={{ padding: '0.4rem', background: 'rgba(211, 47, 47, 0.1)', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: '4px', fontSize: '0.85rem' }}>
                {timeError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '0.4rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px' }} />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ padding: '0.4rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px' }} title="Start Time" />
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ padding: '0.4rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px' }} title="End Time" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold', color: theme.subText }}>Duration presets:</span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'All Day', mins: 'ALL_DAY' },
                  { label: '+30m', mins: 30 },
                  { label: '+1 hr', mins: 60 },
                  { label: '+2 hrs', mins: 120 },
                  { label: '+4 hrs', mins: 240 }
                ].map((p) => {
                  const isActive = activePreset === p.label
                  return (
                    <button
                      type="button"
                      key={p.label}
                      onClick={() => applyPreset(p.mins, p.label)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        border: `1px solid ${isActive ? theme.primary : theme.border}`,
                        borderRadius: '4px',
                        background: isActive ? theme.primary : theme.bg,
                        color: isActive ? '#fff' : theme.text,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 'bold' : 'normal',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 'bold', color: theme.subText }}>Priority:</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ padding: '0.4rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px' }}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
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
              
              {/* Priority Flag Badge */}
              {event.priority && event.priority !== 'medium' && (
                <span
                  style={{
                    backgroundColor: event.priority === 'high' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                    color: event.priority === 'high' ? '#d32f2f' : '#388e3c',
                    border: `1px solid ${event.priority === 'high' ? '#d32f2f' : '#388e3c'}`,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  {event.priority === 'high' ? '🔴 High' : '🟢 Low'}
                </span>
              )}

              {assignedCalendars.map((cal) => (
                <span
                  key={cal.id}
                  style={{
                    backgroundColor: `${cal.color}20`,
                    color: cal.color,
                    border: `1px solid ${cal.color}`,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cal.color, display: 'inline-block' }}></span>
                  {cal.name}
                </span>
              ))}
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
                  {getRecurrenceText()}
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
              <button
                onClick={() => onGoToCalendar && onGoToCalendar(event.date)}
                title="View on Calendar"
                style={{ background: '#607d8b', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                View on Calendar
              </button>
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