import { useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default function CalendarView({ events, themeColors, dateFormat, onDateSelect, onEventClick, calendarRef, highlightedDate }) {
  const internalCalendarRef = useRef(null)
  const activeRef = calendarRef || internalCalendarRef

  // Fix the "Today" button title attribute / tooltip text rendered by FullCalendar
  useEffect(() => {
    const timer = setTimeout(() => {
      const todayBtn = document.querySelector('.fc-today-button')
      if (todayBtn) {
        todayBtn.setAttribute('title', 'Today')
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDateClick = (arg) => {
    if (onDateSelect) onDateSelect(arg.dateStr)
  }

  const handleEventClick = (info) => {
    const rawEvent = info.event.extendedProps.rawEvent
    if (onEventClick) onEventClick(rawEvent)
  }

  const fcEvents = events.map((evt) => {
    const startDateTime = evt.start_time ? `${evt.date}T${evt.start_time}` : evt.date
    const endDateTime = evt.end_time ? `${evt.date}T${evt.end_time}` : undefined
    let calendarColor = '#2196F3'
    if (evt.calendar && evt.calendar.color) {
      calendarColor = evt.calendar.color
    }

    // Add priority prefix symbol for calendar view blocks
    const priorityPrefix = evt.priority === 'high' ? '🔴 ' : evt.priority === 'low' ? '🟢 ' : ''

    return {
      id: String(evt.id),
      title: `${priorityPrefix}${evt.title}`,
      start: startDateTime,
      end: endDateTime,
      allDay: !evt.start_time && !evt.end_time,
      backgroundColor: calendarColor,
      borderColor: calendarColor,
      textColor: '#ffffff',
      extendedProps: {
        rawEvent: evt
      }
    }
  })

  if (highlightedDate) {
    fcEvents.push({
      id: 'highlight-date',
      start: highlightedDate,
      allDay: true,
      display: 'background',
      backgroundColor: `${themeColors.primary}35`
    })
  }

  return (
    <div
      style={{
        background: themeColors.cardBg,
        color: themeColors.text,
        padding: '1rem',
        borderRadius: '8px',
        border: `1px solid ${themeColors.border}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        /* Comprehensive FullCalendar Theme Overrides for Header & Body Readability */
        .fc {
          color: ${themeColors.text} !important;
          background-color: ${themeColors.cardBg} !important;
        }
        /* Toolbar Header Title (Month/Year) */
        .fc .fc-toolbar-title {
          color: ${themeColors.text} !important;
        }
        /* Day of week column headers (Mon, Tue, Wed...) and wrapper header row background */
        .fc .fc-col-header,
        .fc .fc-col-header-cell,
        .fc .fc-scrollgrid-section-header td,
        .fc .fc-scrollgrid-section-header th {
          background-color: ${themeColors.cardBg} !important;
          border-color: ${themeColors.border} !important;
        }
        .fc .fc-col-header-cell-cushion {
          color: ${themeColors.text} !important;
          font-weight: bold !important;
          text-decoration: none !important;
          display: block;
          padding: 8px 4px;
        }
        /* Calendar grid day numbers */
        .fc .fc-daygrid-day-number,
        .fc .fc-timegrid-slot-label-cushion,
        .fc .fc-timegrid-axis-cushion {
          color: ${themeColors.text} !important;
          text-decoration: none !important;
        }
        /* Background grid styling for days/slots */
        .fc .fc-daygrid-day,
        .fc .fc-timegrid-slot,
        .fc .fc-timegrid-axis {
          background-color: transparent !important;
          border-color: ${themeColors.border} !important;
        }
        /* Toolbar Navigation & View Buttons */
        .fc .fc-button-primary {
          background-color: ${themeColors.primary} !important;
          border-color: ${themeColors.primary} !important;
          color: #ffffff !important;
          font-weight: bold;
        }
        .fc .fc-button-primary:hover {
          opacity: 0.9 !important;
        }
        .fc .fc-button-primary:disabled {
          background-color: #888888 !important;
          border-color: #888888 !important;
        }
        .fc .fc-button-active {
          filter: brightness(0.85);
        }
        /* All Borders & Scrollgrid Layout Lines */
        .fc th, .fc td, .fc hr, .fc .fc-scrollgrid, .fc-theme-standard td, .fc-theme-standard th {
          border-color: ${themeColors.border} !important;
        }
        /* Today Highlight cell */
        .fc .fc-day-today {
          background-color: ${themeColors.primary}20 !important;
        }
        /* Other months muted look */
        .fc .fc-day-other .fc-daygrid-day-number {
          opacity: 0.5;
          color: ${themeColors.subText} !important;
        }
      `}</style>
      <FullCalendar
        ref={activeRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth'
        }}
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day'
        }}
        customButtons={{
          today: {
            text: 'Today',
            click: () => {
              const calendarApi = activeRef.current.getApi()
              calendarApi.today()
            }
          }
        }}
        events={fcEvents}
        editable={false}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
      />
    </div>
  )
}