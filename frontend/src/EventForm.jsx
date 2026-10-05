import { useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import RecurrenceBuilder from './RecurrenceBuilder.jsx'
import { useEventTime } from './hooks/useEventTime.js'
import { buildRruleString } from './utils/recurrence.js'

export default function EventForm({ calendars, theme, onEventAdded, defaultDate, defaultEndDate, onCancel }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState('medium')
  const [selectedCalIds, setSelectedCalIds] = useState([])
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (calendars.length > 0 && selectedCalIds.length === 0) {
      setSelectedCalIds([calendars[0].id])
    }
  }, [calendars])

  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate)
      setEndDate(defaultEndDate || defaultDate)
      const d = new Date(defaultDate)
      if (!isNaN(d.getDate())) setMonthDay(d.getDate())
    }
  }, [defaultDate, defaultEndDate])

  const setTodayDate = () => {
    const todayStr = new Date().toISOString().slice(0, 10)
    setDate(todayStr)
    setEndDate(todayStr)
    setMonthDay(new Date().getDate())
  }

  const toggleCalendar = (calId) => {
    setSelectedCalIds((prev) =>
      prev.includes(calId) ? prev.filter((id) => id !== calId) : [...prev, calId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !date || selectedCalIds.length === 0) return
    if (!validateTimes()) return
    setIsSubmitting(true)
    
    // If a multi-day range is selected, append the end date info into notes or handle accordingly
    let finalNotes = notes || ''
    if (endDate && endDate !== date) {
      const rangeNote = `[Multi-day event: ${date} to ${endDate}]`
      finalNotes = finalNotes ? `${finalNotes}\n${rangeNote}` : rangeNote
    }

    const rrule = buildRruleString({
      freq,
      interval,
      endType,
      untilDate,
      count,
      selectedDays,
      monthDay
    })
    try {
      const response = await apiFetch('/events/', {
        method: 'POST',
        body: JSON.stringify({
          title,
          date,
          start_time: startTime || null,
          end_time: endTime || null,
          notes: finalNotes ? finalNotes : null,
          priority,
          calendar_ids: selectedCalIds,
          rrule
        }),
      })
      if (response.ok) {
        onEventAdded()
        setTitle('')
        setDate('')
        setEndDate('')
        setStartTime('')
        setEndTime('')
        setNotes('')
        setPriority('medium')
        setFreq('')
        setInterval(1)
        setEndType('never')
        setUntilDate('')
        setCount(10)
        setSelectedDays([])
        if (onCancel) onCancel()
      }
    } catch (error) {
      console.error('Error submitting event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputStyle = {
    padding: '0.5rem',
    background: theme.cardBg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: '4px',
    boxSizing: 'border-box'
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: theme.cardBg,
        padding: '1rem',
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Create New Event</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.subText,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            &times;
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ ...inputStyle, flexGrow: 1, minWidth: '100%' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: '200px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: theme.subText }}>From:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{ ...inputStyle, flexGrow: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: '200px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: theme.subText }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              style={{ ...inputStyle, flexGrow: 1 }}
            />
          </div>
          <button
            type="button"
            onClick={setTodayDate}
            style={{
              padding: '0.5rem 0.6rem',
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              background: theme.primary,
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            Today
          </button>
        </div>
        {timeError && (
          <div style={{ width: '100%', padding: '0.5rem', background: 'rgba(211, 47, 47, 0.1)', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: '4px', fontSize: '0.85rem' }}>
            {timeError}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: '100%', flexWrap: 'wrap' }}>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            title="Start Time"
          />
          <span>to</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            title="End Time"
          />
          {!startTime && !endTime && (
            <span style={{ fontSize: '0.75rem', color: theme.subText, marginLeft: '0.5rem', fontStyle: 'italic' }}>
              (All-day event)
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: 'bold', color: theme.subText }}>Priority:</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ ...inputStyle, width: 'auto', padding: '0.3rem' }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
        />
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
        theme={theme}
      />
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Add to Calendars:</span>
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
                background: theme.bg,
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: `1px solid ${theme.border}`
              }}
            >
              <input
                type="checkbox"
                checked={selectedCalIds.includes(c.id)}
                onChange={() => toggleCalendar(c.id)}
              />
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: c.color, marginRight: '4px' }}></span>
              {c.name}
            </label>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          type="submit"
          disabled={isSubmitting || selectedCalIds.length === 0}
          style={{
            flex: 1,
            padding: '0.6rem 1rem',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isSubmitting ? 'Adding...' : 'Add Event'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.6rem 1rem',
              background: '#888',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}