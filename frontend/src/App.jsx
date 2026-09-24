import { useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import { themes } from './themes.js'
import pkg from '../package.json'
import AuthForm from './AuthForm.jsx'
import EventForm from './EventForm.jsx'
import EventItem from './EventItem.jsx'
import CalendarView from './CalendarView.jsx'
import EventModal from './EventModal.jsx'
import CalendarManager from './CalendarManager.jsx'
import UserSettingsModal from './UserSettingsModal.jsx'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [currentUser, setCurrentUser] = useState(null)
  const [calendars, setCalendars] = useState([])
  const [activeCalendarIds, setActiveCalendarIds] = useState([])
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [modalEvent, setModalEvent] = useState(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [themeKey, setThemeKey] = useState('light')
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD')
  const [showPastEvents, setShowPastEvents] = useState(false)
  
  // Default start date to today, and end date to 3 months in the future
  const todayObj = new Date()
  const todayStr = todayObj.toISOString().slice(0, 10)
  
  const futureObj = new Date()
  futureObj.setMonth(futureObj.getMonth() + 3)
  const futureStr = futureObj.toISOString().slice(0, 10)

  const [filterStartDate, setFilterStartDate] = useState(todayStr)
  const [filterEndDate, setFilterEndDate] = useState(futureStr)

  const currentTheme = themes[themeKey] || themes.light

  useEffect(() => {
    if (currentUser) {
      const storageKey = `theme_${currentUser.id}`
      let userSavedTheme = localStorage.getItem(storageKey)
      
      if (!userSavedTheme) {
        userSavedTheme = 'light'
        localStorage.setItem(storageKey, 'light')
      }
      
      setThemeKey(userSavedTheme)

      const userSavedFormat = localStorage.getItem(`dateFormat_${currentUser.id}`) || 'YYYY-MM-DD'
      setDateFormat(userSavedFormat)
    } else {
      setThemeKey('light')
      setDateFormat('YYYY-MM-DD')
    }
  }, [currentUser])

  const handleThemeChange = (newTheme) => {
    setThemeKey(newTheme)
    if (currentUser) {
      localStorage.setItem(`theme_${currentUser.id}`, newTheme)
    }
  }

  const handleDateFormatChange = (newFormat) => {
    setDateFormat(newFormat)
    if (currentUser) {
      localStorage.setItem(`dateFormat_${currentUser.id}`, newFormat)
    }
  }

  useEffect(() => {
    document.body.style.backgroundColor = currentTheme.bg
    document.body.style.color = currentTheme.text
    document.body.style.margin = '0'
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease'
  }, [currentTheme])

  const fetchCalendars = async () => {
    try {
      const res = await apiFetch('/calendars')
      if (res.ok) {
        const data = await res.json()
        setCalendars(data)
        if (activeCalendarIds.length === 0) {
          setActiveCalendarIds(data.map((c) => c.id))
        }
      }
    } catch (err) {
      console.error('Failed to fetch calendars:', err)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await apiFetch('/events')
      if (res.ok) {
        const data = await res.json()
        setEvents(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch events:', err)
    }
  }

  const fetchUser = async () => {
    try {
      const res = await apiFetch('/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data)
        fetchCalendars()
        fetchEvents()
      } else {
        handleLogout()
      }
    } catch (err) {
      handleLogout()
    }
  }

  useEffect(() => {
    if (token) {
      fetchUser()
    }
  }, [token])

  const handleToggleCalendar = (calId) => {
    setActiveCalendarIds((prev) =>
      prev.includes(calId) ? prev.filter((id) => id !== calId) : [...prev, calId]
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setCurrentUser(null)
    setEvents([])
    setCalendars([])
    setActiveCalendarIds([])
    setThemeKey('light')
    setDateFormat('YYYY-MM-DD')
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <AuthForm onAuthSuccess={() => setToken(localStorage.getItem('token'))} theme={currentTheme} />
        </div>
        <footer
          style={{
            textAlign: 'center',
            padding: '1rem',
            borderTop: `1px solid ${currentTheme.border}`,
            color: currentTheme.subText,
            fontSize: '0.85rem',
            background: currentTheme.cardBg,
            transition: 'all 0.3s ease'
          }}
        >
          Penguin Cal v{pkg.version} &copy; {new Date().getFullYear()}
        </footer>
      </div>
    )
  }

  const visibleEvents = events.filter((evt) => {
    if (!evt.calendar_ids || evt.calendar_ids.length === 0) return false
    return evt.calendar_ids.some((calId) => activeCalendarIds.includes(calId))
  })
  
  // Filter and sort events chronologically by start date
  const filteredEvents = visibleEvents.filter((evt) => {
    let hasEnded = false
    if (evt.rrule) {
      const untilMatch = evt.rrule.match(/UNTIL=([0-9TZ]+)/)
      if (untilMatch) {
        const untilStr = untilMatch[1]
        const year = untilStr.slice(0, 4)
        const month = untilStr.slice(4, 6)
        const day = untilStr.slice(6, 8)
        const untilDate = `${year}-${month}-${day}`
        if (untilDate < todayStr) {
          hasEnded = true
        }
      }
    } else {
      if (evt.date < todayStr) {
        hasEnded = true
      }
    }

    if (!showPastEvents && hasEnded) {
      return false
    }

    if (filterStartDate && evt.date < filterStartDate) {
      return false
    }

    if (filterEndDate && evt.date > filterEndDate) {
      return false
    }

    return true
  }).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .app-container {
            padding: 0.75rem !important;
          }
          .header-row {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .fc .fc-toolbar {
            flex-direction: column;
            gap: 0.5rem;
          }
          .event-item-row {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 0.5rem;
          }
          .event-item-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>

      <div
        className="app-container"
        style={{
          padding: '2rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          flex: 1,
          boxSizing: 'border-box'
        }}
      >
        <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/penguin-logo.svg"
              alt="Penguin Cal Logo"
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Penguin Cal</h1>
          </div>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem' }}>
              Logged in as: <strong>{currentUser?.display_name || currentUser?.username}</strong>
              {currentUser?.is_admin && (
                <span style={{ marginLeft: '0.5rem', color: '#e65100', fontWeight: 'bold' }}>(Admin)</span>
              )}
            </span>
            <button
              onClick={() => setShowSettingsModal(true)}
              style={{ padding: '0.4rem 0.8rem', background: currentTheme.primary, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              style={{ padding: '0.4rem 0.8rem', background: '#888', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Log Out
            </button>
          </div>
        </div>

        <CalendarManager
          calendars={calendars}
          activeCalendarIds={activeCalendarIds}
          theme={currentTheme}
          onToggleCalendar={handleToggleCalendar}
          onCalendarCreated={() => {
            fetchCalendars()
            fetchEvents()
          }}
        />

        <h2>Create New Event</h2>
        <EventForm calendars={calendars} theme={currentTheme} onEventAdded={fetchEvents} defaultDate={selectedDate} />

        <CalendarView
          events={visibleEvents}
          themeColors={currentTheme}
          dateFormat={dateFormat}
          onDateSelect={(dateStr) => setSelectedDate(dateStr)}
          onEventClick={(evt) => setModalEvent(evt)}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Events</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 'bold', color: currentTheme.subText }}>From:</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                style={{ padding: '0.25rem 0.4rem', background: currentTheme.cardBg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 'bold', color: currentTheme.subText }}>To:</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                style={{ padding: '0.25rem 0.4rem', background: currentTheme.cardBg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: '4px' }}
              />
            </div>
            {(filterStartDate !== todayStr || filterEndDate !== futureStr) && (
              <button
                onClick={() => { setFilterStartDate(todayStr); setFilterEndDate(futureStr); }}
                style={{ padding: '0.25rem 0.5rem', background: 'transparent', color: currentTheme.primary, border: `1px solid ${currentTheme.primary}`, borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Reset Dates
              </button>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', background: currentTheme.cardBg, padding: '0.3rem 0.6rem', borderRadius: '4px', border: `1px solid ${currentTheme.border}` }}>
              <input
                type="checkbox"
                checked={showPastEvents}
                onChange={(e) => setShowPastEvents(e.target.checked)}
              />
              Show past events
            </label>
          </div>
        </div>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((evt) => (
              <EventItem
                key={`${evt.id}-${evt.date}`}
                event={evt}
                theme={currentTheme}
                dateFormat={dateFormat}
                onDelete={async (id, type, date) => {
                  let url = `/events/${id}?delete_type=${type}`
                  if (date) url += `&instance_date=${date}`
                  await apiFetch(url, { method: 'DELETE' })
                  fetchEvents()
                }}
                onUpdate={fetchEvents}
              />
            ))
          ) : (
            <p style={{ color: currentTheme.subText }}>No events found matching the selected range.</p>
          )}
        </ul>

        <EventModal
          isOpen={Boolean(modalEvent)}
          event={modalEvent}
          calendars={calendars}
          theme={currentTheme}
          onClose={() => setModalEvent(null)}
          onSave={async (id, updatedData) => {
            await apiFetch(`/events/${id}`, {
              method: 'PUT',
              body: JSON.stringify(updatedData),
            })
            setModalEvent(null)
            fetchEvents()
          }}
          onDelete={async (id, type, date) => {
            let url = `/events/${id}?delete_type=${type}`
            if (date) url += `&instance_date=${date}`
            await apiFetch(url, { method: 'DELETE' })
            setModalEvent(null)
            fetchEvents()
          }}
        />

        <UserSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          currentUser={currentUser}
          currentTheme={themeKey}
          themeColors={currentTheme}
          dateFormat={dateFormat}
          calendars={calendars}
          onThemeChange={handleThemeChange}
          onDateFormatChange={handleDateFormatChange}
          onUserUpdated={fetchUser}
          onEventsChanged={fetchEvents}
        />
      </div>

      <footer
        style={{
          textAlign: 'center',
          padding: '1rem',
          marginTop: 'auto',
          borderTop: `1px solid ${currentTheme.border}`,
          color: currentTheme.subText,
          fontSize: '0.85rem',
          background: currentTheme.cardBg,
          transition: 'all 0.3s ease'
        }}
      >
        Penguin Cal v{pkg.version} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}