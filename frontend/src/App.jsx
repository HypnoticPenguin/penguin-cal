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
  const currentTheme = themes[themeKey] || themes.light

  useEffect(() => {
    if (currentUser) {
      const userSavedTheme = localStorage.getItem(`theme_${currentUser.id}`) || 'light'
      const userSavedFormat = localStorage.getItem(`dateFormat_${currentUser.id}`) || 'YYYY-MM-DD'
      setThemeKey(userSavedTheme)
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

  const todayStr = new Date().toISOString().slice(0, 10)
  const upcomingEvents = visibleEvents.filter((evt) => {
    if (evt.rrule) return true
    return evt.date >= todayStr
  })

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
      {/* Global CSS Injector for Mobile Responsive Layouts */}
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

        <h2>Calendar Grid</h2>
        <CalendarView
          events={visibleEvents}
          themeColors={currentTheme}
          dateFormat={dateFormat}
          onDateSelect={(dateStr) => setSelectedDate(dateStr)}
          onEventClick={(evt) => setModalEvent(evt)}
        />

        <h2 style={{ marginTop: '2rem' }}>Upcoming Events</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((evt) => (
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
            <p style={{ color: currentTheme.subText }}>No upcoming events found for visible calendars.</p>
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