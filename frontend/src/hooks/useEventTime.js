import { useState } from 'react'

export function useEventTime(initialStartTime = '', initialEndTime = '') {
  const [startTime, setStartTime] = useState(initialStartTime)
  const [endTime, setEndTime] = useState(initialEndTime)
  const [activePreset, setActivePreset] = useState(null)
  const [durationMinutes, setDurationMinutes] = useState(null)

  const handleStartTimeChange = (newStart) => {
    setStartTime(newStart)
    setActivePreset(null)
    // Automatically shift end time if a duration preset is active
    if (durationMinutes && durationMinutes !== 'ALL_DAY' && newStart) {
      const [h, m] = newStart.split(':').map(Number)
      const end = new Date()
      end.setHours(h, m + durationMinutes, 0, 0)
      setEndTime(
        `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
      )
    }
  }

  const applyPreset = (minutes, label) => {
    setActivePreset(label)
    setDurationMinutes(minutes)
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
    setEndTime(
      `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
    )
  }

  const validateTimes = () => {
    if (startTime && endTime) {
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      
      const startTotalMins = startHours * 60 + startMinutes
      const endTotalMins = endHours * 60 + endMinutes

      if (startTotalMins >= endTotalMins) {
        alert("End time must be later than the start time.")
        return false
      }
    }
    return true
  }

  return {
    startTime,
    setStartTime: handleStartTimeChange,
    endTime,
    setEndTime,
    activePreset,
    applyPreset,
    validateTimes
  }
}