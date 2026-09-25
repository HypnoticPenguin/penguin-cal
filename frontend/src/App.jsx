import { useEffect, useRef, useState } from 'react'
import { apiFetch } from './api.js'
import { themes } from './themes.js'
import pkg from '../package.json'
import AuthForm from './AuthForm.jsx'
import EventForm from './EventForm.jsx'
import EventItem from './EventItem.jsx'
import CalendarView from './CalendarView.jsx'
import EventModal from './EventModal.jsx'
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
  const [themeKey, setThemeKey] = useState('auto')
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD')
  const [searchQuery, setSearchQuery] = useState('')
  const calendarRef = useRef(null)

  // System preference listener for 'auto' theme mode
  const [systemPrefDark, setSystemPrefDark] = useState(
    window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  )

  useEffect(() => {
    if (!window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => setSystemPrefDark(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme = themeKey === 'auto'
    ? (systemPrefDark ? themes.dark : themes.light)
    : (themes[themeKey] || themes.light)

  const todayObj = new Date()
  const todayStr = todayObj.toISOString().slice(0, 10)
  const futureObj = new Date()
  futureObj.setMonth(futureObj.getMonth() + 3)
  const futureStr = futureObj.toISOString().slice(0, 10)

  const [filterStartDate, setFilterStartDate] = useState(todayStr)
  const [filterEndDate, setFilterEndDate] = useState(futureStr)

  useEffect(() => {
    if (currentUser) {
      const storageKey = `theme_${currentUser.id}`
      let userSavedTheme = localStorage.getItem(storageKey)
             
      if (!userSavedTheme) {
        userSavedTheme = 'auto'
        localStorage.setItem(storageKey, 'auto')
      }
             
      setThemeKey(userSavedTheme)
      const userSavedFormat = localStorage.getItem(`dateFormat_${currentUser.id}`) || 'YYYY-MM-DD'
      setDateFormat(userSavedFormat)
    } else {
      setThemeKey('auto')
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
    document.body.style.backgroundColor = resolvedTheme.bg
    document.body.style.color = resolvedTheme.text
    document.body.style.margin = '0'
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease'
  }, [resolvedTheme])

  const fetchCalendars = async () => {
    try {
      const res = await apiFetch('/calendars/')
      if (res.ok) {
        const data = await res.json()
        setCalendars(data)
        
        // Restore persisted calendar visibility if available, otherwise default to all active
        if (currentUser) {
          const savedCals = localStorage.getItem(`active_cals_${currentUser.id}`)
          if (savedCals) {
            try {
              const parsed = JSON.parse(savedCals)
              const validIds = parsed.filter(id => data.some(c => c.id === id))
              setActiveCalendarIds(validIds)
              return
            } catch (e) {}
          }
        }
        setActiveCalendarIds(data.map((c) => c.id))
      }
    } catch (err) {
      console.error('Failed to fetch calendars:', err)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await apiFetch('/events/')
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
    setActiveCalendarIds((prev) => {
      const next = prev.includes(calId) ? prev.filter((id) => id !== calId) : [...prev, calId]
      if (currentUser) {
        localStorage.setItem(`active_cals_${currentUser.id}`, JSON.stringify(next))
      }
      return next
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setCurrentUser(null)
    setEvents([])
    setCalendars([])
    setActiveCalendarIds([])
    setThemeKey('auto')
    setDateFormat('YYYY-MM-DD')
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <style>{`
          button {
            transition: all 0.15s ease !important;
            cursor: pointer !important;
          }
          button:active {
            transform: scale(0.96) !important;
            opacity: 0.85 !important;
          }
          button:disabled {
            cursor: not-allowed !important;
            transform: none !important;
            opacity: 0.6 !important;
          }
        `}</style>
        <div style={{ flex: 1 }}>
          <AuthForm onAuthSuccess={() => setToken(localStorage.getItem('token'))} theme={resolvedTheme} />
        </div>
        <footer
          style={{
            textAlign: 'center',
            padding: '1rem',
            borderTop: `1px solid ${resolvedTheme.border}`,
            color: resolvedTheme.subText,
            fontSize: '0.85rem',
            background: resolvedTheme.cardBg,
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

  const filteredEvents = visibleEvents.filter((evt) => {
    if (filterStartDate && evt.date < filterStartDate) {
      return false
    }
    if (filterEndDate && evt.date > filterEndDate) {
      return false
    }
         
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = evt.title && evt.title.toLowerCase().includes(query)
      const matchesNotes = evt.notes && evt.notes.toLowerCase().includes(query)
      if (!matchesTitle && !matchesNotes) {
        return false
      }
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
        button {
          transition: all 0.15s ease !important;
          cursor: pointer !important;
        }
        button:active {
          transform: scale(0.96) !important;
          opacity: 0.85 !important;
        }
        button:disabled {
          cursor: not-allowed !important;
          transform: none !important;
          opacity: 0.6 !important;
        }
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
              style={{ padding: '0.4rem 0.8rem', background: resolvedTheme.primary, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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

        {/* Calendar visibility filter chips */}
        <div
          style={{
            background: resolvedTheme.cardBg,
            color: resolvedTheme.text,
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: `1px solid ${resolvedTheme.border}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem' }}>Calendars</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: resolvedTheme.subText }}>
                Check boxes to toggle calendar visibility. Manage or add calendars in Settings or click Manage Calendars.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              style={{ padding: '0.35rem 0.7rem', background: resolvedTheme.primary, color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}
            >
                Manage Calendars
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {calendars.map((cal) => {
              const isVisible = activeCalendarIds.includes(cal.id)
              return (
                <label
                  key={cal.id}
                  title="Click to toggle calendar visibility"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: isVisible ? `${cal.color}15` : resolvedTheme.bg,
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    border: `1px solid ${isVisible ? cal.color : resolvedTheme.border}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => handleToggleCalendar(cal.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cal.color }}></span>
                  <span style={{ fontWeight: isVisible ? 'bold' : 'normal' }}>{cal.name}</span>
                </label>
              )
            })}
          </div>
        </div>

        <h2>Create New Event</h2>
        <EventForm calendars={calendars} theme={resolvedTheme} onEventAdded={fetchEvents} defaultDate={selectedDate} />

        <CalendarView
          calendarRef={calendarRef}
          events={visibleEvents}
          themeColors={resolvedTheme}
          dateFormat={dateFormat}
          highlightedDate={selectedDate}
          onDateSelect={(dateStr) => setSelectedDate(dateStr)}
          onEventClick={(evt) => setModalEvent(evt)}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Events</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.3rem 0.5rem',
                  background: resolvedTheme.cardBg,
                  color: resolvedTheme.text,
                  border: `1px solid ${resolvedTheme.border}`,
                  borderRadius: '4px',
                  width: '150px'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    padding: '0.25rem 0.4rem',
                    background: 'transparent',
                    color: resolvedTheme.subText,
                    border: `1px solid ${resolvedTheme.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 'bold', color: resolvedTheme.subText }}>From:</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                style={{ padding: '0.25rem 0.4rem', background: resolvedTheme.cardBg, color: resolvedTheme.text, border: `1px solid ${resolvedTheme.border}`, borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 'bold', color: resolvedTheme.subText }}>To:</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                style={{ padding: '0.25rem 0.4rem', background: resolvedTheme.cardBg, color: resolvedTheme.text, border: `1px solid ${resolvedTheme.border}`, borderRadius: '4px' }}
              />
            </div>
            {(filterStartDate !== todayStr || filterEndDate !== futureStr) && (
              <button
                onClick={() => { setFilterStartDate(todayStr); setFilterEndDate(futureStr); }}
                style={{ padding: '0.25rem 0.5rem', background: 'transparent', color: resolvedTheme.primary, border: `1px solid ${resolvedTheme.primary}`, borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Reset Dates
              </button>
            )}
          </div>
        </div>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((evt) => (
              <EventItem
                key={`${evt.id}-${evt.date}`}
                event={evt}
                calendars={calendars}
                theme={resolvedTheme}
                dateFormat={dateFormat}
                onGoToCalendar={(dateStr) => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  setSelectedDate(dateStr)
                  if (calendarRef.current) {
                    const calendarApi = calendarRef.current.getApi()
                    calendarApi.gotoDate(dateStr)
                  }
                }}
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
            <p style={{ color: resolvedTheme.subText }}>No events found matching your search or date range.</p>
          )}
        </ul>

        <EventModal
          isOpen={Boolean(modalEvent)}
          event={modalEvent}
          calendars={calendars}
          theme={resolvedTheme}
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
          themeColors={resolvedTheme}
          dateFormat={dateFormat}
          calendars={calendars}
          onThemeChange={handleThemeChange}
          onDateFormatChange={handleDateFormatChange}
          onUserUpdated={fetchUser}
          onEventsChanged={fetchEvents}
          onCalendarsChanged={() => {
            fetchCalendars()
            fetchEvents()
          }}
        />
      </div>

      <footer
        style={{
          textAlign: 'center',
          padding: '1rem',
          marginTop: 'auto',
          borderTop: `1px solid ${resolvedTheme.border}`,
          color: resolvedTheme.subText,
          fontSize: '0.85rem',
          background: resolvedTheme.cardBg,
          transition: 'all 0.3s ease'
        }}
      >
        Penguin Cal v{pkg.version} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}