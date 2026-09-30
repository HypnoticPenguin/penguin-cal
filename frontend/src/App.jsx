import { useEffect, useRef, useState } from 'react'
import { apiFetch } from './api.js'
import { themes } from './themes.js'
import pkg from '../package.json'
import AuthForm from './AuthForm.jsx'
import EventForm from './EventForm.jsx'
import EventItem from './EventItem.jsx'
import CalendarView from './CalendarView.jsx'
import EventModal from './EventModal.jsx'
import AccountSettingsModal from './AccountSettingsModal.jsx'
import DataSettingsModal from './DataSettingsModal.jsx'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [currentUser, setCurrentUser] = useState(null)
  const [calendars, setCalendars] = useState([])
  const [activeCalendarIds, setActiveCalendarIds] = useState([])
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [modalEvent, setModalEvent] = useState(null)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showDataModal, setShowDataModal] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const calendarRef = useRef(null)

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

  const themeKey = currentUser?.theme || 'auto'
  const dateFormat = currentUser?.date_format || 'YYYY-MM-DD'
  const timeFormat = currentUser?.time_format || '12h'
  const dayStartTime = currentUser?.day_start_time || '06:00:00'

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

  const handleThemeChange = async (newTheme) => {
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ theme: newTheme })
      })
      if (res.ok) {
        const updated = await res.json()
        setCurrentUser(updated)
      }
    } catch (err) {
      console.error('Failed to update theme preference', err)
    }
  }

  const handleDateFormatChange = async (newFormat) => {
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ date_format: newFormat })
      })
      if (res.ok) {
        const updated = await res.json()
        setCurrentUser(updated)
      }
    } catch (err) {
      console.error('Failed to update date format preference', err)
    }
  }

  const handleTimeFormatChange = async (newFormat) => {
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ time_format: newFormat })
      })
      if (res.ok) {
        const updated = await res.json()
        setCurrentUser(updated)
      }
    } catch (err) {
      console.error('Failed to update time format preference', err)
    }
  }

  const handleDayStartTimeChange = async (newStartTime) => {
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ day_start_time: newStartTime })
      })
      if (res.ok) {
        const updated = await res.json()
        setCurrentUser(updated)
      }
    } catch (err) {
      console.error('Failed to update day start time preference', err)
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
        setActiveCalendarIds((prev) => {
          const allIds = data.map((c) => c.id)
          if (currentUser) {
            const savedCals = localStorage.getItem(`active_cals_${currentUser.id}`)
            if (savedCals) {
              try {
                const parsed = JSON.parse(savedCals)
                const validIds = parsed.filter(id => allIds.includes(id))
                const brandNewIds = allIds.filter(id => !validIds.includes(id))
                const combined = [...validIds, ...brandNewIds]
                localStorage.setItem(`active_cals_${currentUser.id}`, JSON.stringify(combined))
                return combined
              } catch (e) {}
            }
          }
          return allIds
        })
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
            transition: 'all 0.3s ease',
            fontFamily: 'sans-serif'
          }}
        >
          <a
            href="https://github.com/HypnoticPenguin/penguin-cal"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: resolvedTheme.primary, textDecoration: 'none', fontFamily: 'sans-serif' }}
          >
            Penguin Cal v{pkg.version}
          </a> &copy; {new Date().getFullYear()}
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
        <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
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
              onClick={() => setShowAccountModal(true)}
              style={{ padding: '0.4rem 0.8rem', background: resolvedTheme.primary, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Account
            </button>
            <button
              onClick={() => setShowDataModal(true)}
              style={{ padding: '0.4rem 0.8rem', background: '#607d8b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Settings & Calendars
            </button>
            <button
              onClick={handleLogout}
              style={{ padding: '0.4rem 0.8rem', background: '#888', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Log Out
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => setShowEventForm(!showEventForm)}
            style={{
              padding: '0.5rem 1rem',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {showEventForm ? 'Close Form' : '+ Create New Event'}
          </button>
        </div>

        {showEventForm && (
          <EventForm
            calendars={calendars}
            theme={resolvedTheme}
            onEventAdded={fetchEvents}
            defaultDate={selectedDate}
            onCancel={() => setShowEventForm(false)}
          />
        )}

        <CalendarView
          calendarRef={calendarRef}
          events={visibleEvents}
          calendars={calendars}
          themeColors={resolvedTheme}
          dateFormat={dateFormat}
          timeFormat={timeFormat}
          dayStartTime={dayStartTime}
          highlightedDate={selectedDate}
          onDateSelect={(dateStr) => {
            setSelectedDate(dateStr)
            setShowEventForm(true)
          }}
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
                timeFormat={timeFormat}
                onGoToCalendar={(dateStr) => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  setSelectedDate(dateStr)
                }}
                onEdit={() => setModalEvent(evt)}
                onDelete={async (id, type, date) => {
                  let url = `/events/${id}?delete_type=${type}`
                  if (date) url += `&instance_date=${date}`
                  await apiFetch(url, { method: 'DELETE' })
                  fetchEvents()
                }}
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

        <AccountSettingsModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          currentUser={currentUser}
          themeColors={resolvedTheme}
          onUserUpdated={fetchUser}
        />

        <DataSettingsModal
          isOpen={showDataModal}
          onClose={() => setShowDataModal(false)}
          currentUser={currentUser}
          currentTheme={themeKey}
          themeColors={resolvedTheme}
          dateFormat={dateFormat}
          timeFormat={timeFormat}
          dayStartTime={dayStartTime}
          calendars={calendars}
          activeCalendarIds={activeCalendarIds}
          onThemeChange={handleThemeChange}
          onDateFormatChange={handleDateFormatChange}
          onTimeFormatChange={handleTimeFormatChange}
          onDayStartTimeChange={handleDayStartTimeChange}
          onEventsChanged={fetchEvents}
          onCalendarsChanged={() => {
            fetchCalendars()
            fetchEvents()
          }}
          onToggleCalendar={handleToggleCalendar}
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
          transition: 'all 0.3s ease',
          fontFamily: 'sans-serif'
        }}
      >
        <a
          href="https://github.com/HypnoticPenguin/penguin-cal"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: resolvedTheme.primary, textDecoration: 'none', fontFamily: 'sans-serif' }}
        >
          Penguin Cal v{pkg.version}
        </a> &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}