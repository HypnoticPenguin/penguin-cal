export function buildRruleString({ freq, interval, endType, untilDate, count, selectedDays, monthDay }) {
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