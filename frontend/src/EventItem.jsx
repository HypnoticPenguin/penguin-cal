import { useState } from 'react'
import { apiFetch } from './api.js'
import DeleteModal from './DeleteModal.jsx'

export default function EventItem({ event, onDelete, onUpdate }) {
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
          <div>
            <span>
              <strong>{event.date}{formatTimeDisplay()}:</strong> {event.title}
            </span>
            {event.rrule && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#666' }}>({event.rrule})</span>}
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