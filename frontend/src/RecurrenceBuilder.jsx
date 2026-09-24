export default function RecurrenceBuilder({
  freq,
  setFreq,
  interval,
  setInterval,
  endType,
  setEndType,
  untilDate,
  setUntilDate,
  count,
  setCount,
  selectedDays,
  setSelectedDays,
  monthDay,
  setMonthDay,
  theme
}) {
  const daysOfWeek = [
    { label: 'Mon', value: 'MO' },
    { label: 'Tue', value: 'TU' },
    { label: 'Wed', value: 'WE' },
    { label: 'Thu', value: 'TH' },
    { label: 'Fri', value: 'FR' },
    { label: 'Sat', value: 'SA' },
    { label: 'Sun', value: 'SU' },
  ]

  const toggleDay = (dayVal) => {
    setSelectedDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    )
  }

  const inputStyle = {
    padding: '0.4rem',
    background: theme.bg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: '4px',
    boxSizing: 'border-box'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Recurrence</label>
        <select
          value={freq}
          onChange={(e) => setFreq(e.target.value)}
          style={{ width: '100%', ...inputStyle }}
        >
          <option value="">Does not repeat</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly</option>
        </select>
      </div>

      {freq && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: theme.bg, padding: '0.75rem', borderRadius: '4px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Repeat every:</span>
            <input
              type="number"
              min="1"
              max="99"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              style={{ ...inputStyle, width: '60px' }}
            />
            <span style={{ fontSize: '0.85rem' }}>
              {freq === 'DAILY' ? 'day(s)' : freq === 'WEEKLY' ? 'week(s)' : freq === 'MONTHLY' ? 'month(s)' : 'year(s)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Ends:</span>
            <select
              value={endType}
              onChange={(e) => setEndType(e.target.value)}
              style={{ ...inputStyle, width: 'auto', flexGrow: 1 }}
            >
              <option value="never">Never</option>
              <option value="until">On date</option>
              <option value="count">After occurrences</option>
            </select>
            {endType === 'until' && (
              <input
                type="date"
                value={untilDate}
                onChange={(e) => setUntilDate(e.target.value)}
                required
                style={{ ...inputStyle, width: '100%' }}
              />
            )}
            {endType === 'count' && (
              <input
                type="number"
                min="1"
                max="999"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                style={{ ...inputStyle, width: '70px' }}
              />
            )}
          </div>

          {freq === 'WEEKLY' && (
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', width: '100%' }}>Repeat on:</span>
              {daysOfWeek.map((day) => (
                <button
                  type="button"
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '4px',
                    background: selectedDays.includes(day.value) ? theme.primary : theme.cardBg,
                    color: selectedDays.includes(day.value) ? '#fff' : theme.text,
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}

          {freq === 'MONTHLY' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Day of month:</span>
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
        </div>
      )}
    </div>
  )
}