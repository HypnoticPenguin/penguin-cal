import { useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'

export default function CalendarView({ events, themeColors, dateFormat, timeFormat = '12h', dayStartTime = '06:00:00', onDateSelect, onEventClick, calendarRef, highlightedDate }) {
  const internalCalendarRef = useRef(null)
  const activeRef = calendarRef || internalCalendarRef
  const is12h = timeFormat === '12h'

  useEffect(() => {
    if (activeRef.current) {
      const calendarApi = activeRef.current.getApi()
      if (calendarApi.view.type.startsWith('timeGrid')) {
        calendarApi.scrollToTime(dayStartTime)
      }
    }
  }, [dayStartTime])

  // Updated: Jump to the date AND trigger a visual selection/highlight
  useEffect(() => {
    if (activeRef.current && highlightedDate) {
      const calendarApi = activeRef.current.getApi()
      calendarApi.gotoDate(highlightedDate)
      
      // Select the specific date so FullCalendar highlights it visually
      calendarApi.unselect()
      calendarApi.select(highlightedDate)
    }
  }, [highlightedDate])

  useEffect(() => {
    const timer = setTimeout(() => {
      const todayBtn = document.querySelector('.fc-today-button')
      if (todayBtn) {
        todayBtn.setAttribute('title', 'Today')
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDateSelect = (arg) => {
    if (onDateSelect) {
      const startStr = arg.startStr.slice(0, 10)
      let endStr = startStr
      if (arg.endStr) {
        const rawEnd = new Date(arg.endStr)
        if (!arg.allDay) {
          endStr = arg.endStr.slice(0, 10)
        } else {
          rawEnd.setDate(rawEnd.getDate() - 1)
          endStr = rawEnd.toISOString().slice(0, 10)
        }
      }
      onDateSelect({ startDate: startStr, endDate: endStr })
    }
  }

  const handleEventClick = (info) => {
    const rawEvent = info.event.extendedProps.rawEvent
    const instanceDate = info.event.startStr ? info.event.startStr.slice(0, 10) : rawEvent.date
    if (onEventClick) {
      onEventClick({ ...rawEvent, instanceDate })
    }
  }

  const fcEvents = events.map((evt) => {
    const startDateTime = evt.start_time ? `${evt.date}T${evt.start_time}` : evt.date
    const endDateTime = evt.end_time ? `${evt.date}T${evt.end_time}` : undefined
    const calendarColor = evt.color || '#2196F3'
    const isAllDay = !evt.start_time && !evt.end_time
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

  const formatEventTimeStr = (timeStr) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hourNum = parseInt(h, 10)
    if (isNaN(hourNum)) return timeStr
    if (timeFormat === '24h') {
      return `${String(hourNum).padStart(2, '0')}:${m}`
    }
    const meridiem = hourNum >= 12 ? 'PM' : 'AM'
    const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12
    return `${formattedHour}:${m} ${meridiem}`
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
        .fc {
          color: ${themeColors.text} !important;
          background-color: ${themeColors.cardBg} !important;
        }
        .fc .fc-toolbar-title {
          color: ${themeColors.text} !important;
        }
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
        .fc .fc-daygrid-day-number,
        .fc .fc-timegrid-slot-label-cushion,
        .fc .fc-timegrid-axis-cushion {
          color: ${themeColors.text} !important;
          text-decoration: none !important;
        }
        .fc .fc-daygrid-day,
        .fc .fc-timegrid-slot,
        .fc .fc-timegrid-axis {
          background-color: transparent !important;
          border-color: ${themeColors.border} !important;
        }
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
        .fc th, .fc td, .fc hr, .fc .fc-scrollgrid, .fc-theme-standard td, .fc-theme-standard th {
          border-color: ${themeColors.border} !important;
        }
        .fc .fc-day-today {
          background-color: ${themeColors.primary}25 !important;
          border: 2px solid ${themeColors.primary} !important;
        }
        .fc .fc-day-today .fc-daygrid-day-number {
          font-weight: 800 !important;
          color: ${themeColors.primary} !important;
        }
        .fc .fc-highlight {
          background-color: ${themeColors.primary}55 !important;
          border: 2px dashed ${themeColors.primary} !important;
          opacity: 1 !important;
        }
        .fc .fc-day-other .fc-daygrid-day-number {
          opacity: 0.5;
          color: ${themeColors.subText} !important;
        }
        .fc-daygrid-event {
          border-radius: 4px;
          padding: 1px 2px;
        }
        .fc-popover {
          background-color: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          border: 1px solid ${themeColors.border} !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .fc-popover-header {
          background-color: ${themeColors.bg} !important;
          color: ${themeColors.text} !important;
          border-bottom: 1px solid ${themeColors.border} !important;
          padding: 6px 10px !important;
        }
        .fc-popover-body {
          background-color: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          padding: 8px !important;
        }
        .fc-popover .fc-popover-close {
          opacity: 0.8 !important;
          color: ${themeColors.text} !important;
        }
      `}</style>
      <FullCalendar
        ref={activeRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
        initialView="dayGridMonth"
        scrollTime={dayStartTime}
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
        unselectAuto={false}
        dayMaxEvents={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        height="700px"
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          omitZeroMinute: false,
          meridiem: is12h ? 'short' : false,
          hour12: is12h
        }}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: is12h ? 'short' : false,
          hour12: is12h
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
          const timeStr = rawEvent && rawEvent.start_time ? formatEventTimeStr(rawEvent.start_time.slice(0, 5)) : ''
          
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