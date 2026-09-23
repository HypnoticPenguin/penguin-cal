import { useEffect, useState } from 'react'
import { apiFetch } from './api.js'

export default function EventForm({ calendars, theme, onEventAdded, defaultDate }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [selectedCalIds, setSelectedCalIds] = useState([])
  const [freq, setFreq] = useState('')
  const [selectedDays, setSelectedDays] = useState([])
  const [monthDay, setMonthDay] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const daysOfWeek = [
    { label: 'Mon', value: 'MO' },
    { label: 'Tue', value: 'TU' },
    { label: 'Wed', value: 'WE' },
    { label: 'Thu', value: 'TH' },
    { label: 'Fri', value: 'FR' },
    { label: 'Sat', value: 'SA' },
    { label: 'Sun', value: 'SU' },
  ]

  useEffect(() => {
    if (calendars.length > 0 && selectedCalIds.length === 0) {
      setSelectedCalIds([calendars[0].id])
    }
  }, [calendars])

  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate)
      const d = new Date(defaultDate)
      if (!isNaN(d.getDate())) setMonthDay(d.getDate())
    }
  }, [defaultDate])

  const setTodayDate = () => {
    const todayStr = new Date().toISOString().slice(0, 10)
    setDate(todayStr)
    setMonthDay(new Date().getDate())
  }

  const toggleCalendar = (calId) => {
    setSelectedCalIds((prev) =>
      prev.includes(calId) ? prev.filter((id) => id !== calId) : [...prev, calId]
    )
  }

  const toggleDay = (dayVal) => {
    setSelectedDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    )
  }

  const applyDurationPreset = (minutes) => {
    if (minutes === 'ALL_DAY') {
      setStartTime('')
      setEndTime('')
      return
    }

    const start = startTime || '09:00'
    if (!startTime) setStartTime('09:00')

    const [h, m] = start.split(':').map(Number)
    const end = new Date()
    end.setHours(h, m + minutes, 0, 0)

    const endH = String(end.getHours()).padStart(2, '0')
    const endM = String(end.getMinutes()).padStart(2, '0')
    setEndTime(`${endH}:${endM}`)
  }

  const buildRruleString = () => {
    if (!freq) return null
    if (freq === 'DAILY') return 'FREQ=DAILY'
    if (freq === 'WEEKLY') {
      if (selectedDays.length === 0) return 'FREQ=WEEKLY'
      return `FREQ=WEEKLY;BYDAY=${selectedDays.join(',')}`
    }
    if (freq === 'MONTHLY') return `FREQ=MONTHLY;BYMONTHDAY=${monthDay}`
    if (freq === 'YEARLY') return 'FREQ=YEARLY'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !date || selectedCalIds.length === 0) return
    setIsSubmitting(true)
    const rrule = buildRruleString()
    try {
      const response = await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify({
          title,
          date,
          start_time: startTime || null,
          end_time: endTime || null,
          calendar_ids: selectedCalIds,
          rrule
        }),
      })
      if (response.ok) {
        onEventAdded()
        setTitle('')
        setDate('')
        setStartTime('')
        setEndTime('')
        setFreq('')
        setSelectedDays([])
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
    borderRadius: '4px'
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
        borderRadius: '6px',
        border: `1px solid ${theme.border}`,
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ ...inputStyle, flexGrow: 1, minWidth: '180px' }}
        />
        
        {/* Date Selector + Today Shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={inputStyle}
          />
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
              fontSize: '0.85rem'
            }}
          >
            Today
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={inputStyle}
            title="Start Time"
          />
          <span>to</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            style={inputStyle}
            title="End Time"
          />
        </div>
        <select
          value={freq}
          onChange={(e) => setFreq(e.target.value)}
          style={inputStyle}
        >
          <option value="">Does not repeat</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly</option>
        </select>
      </div>

      {/* Duration Quick Presets including All Day */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
        <span style={{ fontWeight: 'bold', color: theme.subText }}>Duration presets:</span>
        {[
          { label: 'All Day', mins: 'ALL_DAY' },
          { label: '+30m', mins: 30 },
          { label: '+1 hr', mins: 60 },
          { label: '+2 hrs', mins: 120 },
          { label: '+4 hrs', mins: 240 }
        ].map((p) => (
          <button
            type="button"
            key={p.label}
            onClick={() => applyDurationPreset(p.mins)}
            style={{
              padding: '0.25rem 0.5rem',
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              background: theme.bg,
              color: theme.text,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Add to Calendars:</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
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

      {freq === 'WEEKLY' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Repeat on:</span>
          {daysOfWeek.map((day) => (
            <button
              type="button"
              key={day.value}
              onClick={() => toggleDay(day.value)}
              style={{
                padding: '0.3rem 0.6rem',
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
                background: selectedDays.includes(day.value) ? theme.primary : theme.bg,
                color: selectedDays.includes(day.value) ? '#fff' : theme.text,
                cursor: 'pointer'
              }}
            >
              {day.label}
            </button>
          ))}
        </div>
      )}

      {freq === 'MONTHLY' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Day of month:</span>
          <input
            type="number"
            min="1"
            max="31"
            value={monthDay}
            onChange={(e) => setMonthDay(Number(e.target.value))}
            style={{ ...inputStyle, width: '60px' }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || selectedCalIds.length === 0}
        style={{
          padding: '0.6rem 1rem',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          alignSelf: 'flex-start',
          fontWeight: 'bold'
        }}
      >
        {isSubmitting ? 'Adding...' : 'Add Event'}
      </button>
    </form>
  )
}