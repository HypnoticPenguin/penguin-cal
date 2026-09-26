import { useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'

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
    // Capture the exact instance date clicked from FullCalendar
    const instanceDate = info.event.startStr ? info.event.startStr.slice(0, 10) : rawEvent.date
    if (onEventClick) {
      onEventClick({ ...rawEvent, instanceDate })
    }
  }

  const fcEvents = events.map((evt) => {
    const startDateTime = evt.start_time ? `${evt.date}T${evt.start_time}` : evt.date
    const endDateTime = evt.end_time ? `${evt.date}T${evt.end_time}` : undefined
         
    // Use the backend-computed color (which handles first-calendar precedence)
    const calendarColor = evt.color || '#2196F3'
    const isAllDay = !evt.start_time && !evt.end_time

    // Base event object mapping
    const mappedEvent = {
      id: String(evt.id),
      title: evt.title,
      allDay: isAllDay,
      display: isAllDay ? 'auto' : 'block',
      backgroundColor: calendarColor,
      borderColor: calendarColor,
      textColor: '#ffffff',
      extendedProps: {
        rawEvent: evt
      }
    }

    // Handle recurring vs one-off event properties explicitly, including exception dates for deleted instances
    if (evt.rrule) {
      const cleanDtStart = `${startDateTime.replace(/[-:]/g, '')}${startDateTime.length === 10 ? 'T000000' : ''}`
      let rruleStr = `DTSTART:${cleanDtStart}\nRRULE:${evt.rrule}`

      if (evt.exdates && evt.exdates.length > 0) {
        evt.exdates.forEach((d) => {
          const cleanDate = d.replace(/-/g, '')
          rruleStr += `\nEXDATE:${cleanDate}T000000Z`
        })
      }
      mappedEvent.rrule = rruleStr
    } else {
      mappedEvent.start = startDateTime
      mappedEvent.end = endDateTime
    }
    return mappedEvent
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
        .fc-daygrid-event {
          border-radius: 4px;
          padding: 1px 2px;
        }
      `}</style>
      <FullCalendar
        ref={activeRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
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
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          omitZeroMinute: false,
          meridiem: 'short'
        }}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        eventDidMount={(info) => {
          if (info.event.backgroundColor) {
            info.el.style.backgroundColor = info.event.backgroundColor
            info.el.style.borderColor = info.event.borderColor
            info.el.style.color = '#ffffff'
          }
        }}
        eventContent={(arg) => {
          const rawEvent = arg.event.extendedProps.rawEvent
          const priority = rawEvent ? rawEvent.priority : 'medium'
          const isAllDay = arg.event.allDay
          const timeStr = rawEvent && rawEvent.start_time ? rawEvent.start_time.slice(0, 5) : ''
                     
          // Skip medium, show explicit label for high/low priority
          const priorityLabel = priority === 'high' ? 'High' : priority === 'low' ? 'Low' : ''
          const priorityBg = priority === 'high' ? '#d32f2f' : priority === 'low' ? '#388e3c' : ''

          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                fontSize: '0.8rem',
                padding: '1px 2px',
                boxSizing: 'border-box',
                color: '#ffffff'
              }}
            >
              {priorityLabel && (
                <span
                  style={{
                    background: priorityBg,
                    color: '#ffffff',
                    padding: '0.5px 3px',
                    borderRadius: '3px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}
                >
                  {priorityLabel}
                </span>
              )}
              {timeStr && !isAllDay && (
                <span style={{ fontSize: '0.75rem', opacity: 0.9, flexShrink: 0, fontWeight: 'bold' }}>
                  {timeStr}
                </span>
              )}
              {isAllDay && (
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    padding: '0.5px 4px',
                    borderRadius: '3px',
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    letterSpacing: '-0.2px'
                  }}
                >
                  All day
                </span>
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                {arg.event.title}
              </span>
            </div>
          )
        }}
      />
    </div>
  )
}