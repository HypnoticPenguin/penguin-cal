import FullCalendar from '@fullcalendar/react' 
import dayGridPlugin from '@fullcalendar/daygrid' 
import timeGridPlugin from '@fullcalendar/timegrid' 
import interactionPlugin from '@fullcalendar/interaction' 
import rrulePlugin from '@fullcalendar/rrule' 

export default function CalendarView({ events, themeColors, onDateSelect, onEventClick }) {
  const parseRrule = (rruleStr, dtstart) => {
    if (!rruleStr) return null
    const parts = rruleStr.split(';').reduce((acc, part) => {
      const [key, val] = part.split('=')
      acc[key] = val
      return acc
    }, {})
    const ruleObj = {
      freq: parts.FREQ ? parts.FREQ.toLowerCase() : 'weekly',
      dtstart: dtstart,
    }
    if (parts.BYDAY) ruleObj.byweekday = parts.BYDAY.split(',').map((d) => d.toLowerCase())
    if (parts.BYMONTHDAY) ruleObj.bymonthday = parts.BYMONTHDAY.split(',').map(Number)
    return ruleObj
  }

  const formattedEvents = events.map((evt) => {
    const baseEvent = {
      id: String(evt.id),
      title: evt.title,
      backgroundColor: evt.color || themeColors.primary,
      borderColor: evt.color || themeColors.primary,
      extendedProps: { rawEvent: evt }
    }

    const startTimeVal = evt.start_time || evt.time
    const startDateTime = startTimeVal ? `${evt.date}T${startTimeVal}:00` : evt.date
    const endDateTime = evt.end_time ? `${evt.date}T${evt.end_time}:00` : undefined

    if (evt.rrule) {
      return {
        ...baseEvent,
        rrule: parseRrule(evt.rrule, startDateTime),
        exdate: evt.exdates || []
      }
    }

    return {
      ...baseEvent,
      start: startDateTime,
      end: endDateTime,
      allDay: !startTimeVal
    }
  })

  return (
    <div
      style={{
        marginTop: '1.5rem',
        background: themeColors.cardBg,
        color: themeColors.text,
        padding: '1rem',
        borderRadius: '8px',
        border: `1px solid ${themeColors.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease'
      }}
    >
      <style>{`
        div.fc {
          color: ${themeColors.text} !important;
          background-color: ${themeColors.cardBg} !important;
        }

        div.fc .fc-theme-standard td, 
        div.fc .fc-theme-standard th,
        div.fc .fc-scrollgrid {
          border-color: ${themeColors.border} !important;
        }

        div.fc .fc-toolbar-title {
          color: ${themeColors.text} !important;
        }
        div.fc .fc-button-primary {
          background-color: ${themeColors.primary} !important;
          border-color: ${themeColors.primary} !important;
          color: #ffffff !important;
        }

        div.fc .fc-col-header-cell {
          background-color: ${themeColors.accentBg || themeColors.cardBg} !important;
        }
        div.fc .fc-col-header-cell-cushion,
        div.fc a.fc-col-header-cell-cushion {
          color: ${themeColors.text} !important;
          font-weight: bold !important;
          text-decoration: none !important;
        }

        div.fc .fc-daygrid-day-number,
        div.fc a.fc-daygrid-day-number,
        div.fc .fc-timegrid-slot-label-cushion,
        div.fc .fc-timegrid-axis-cushion {
          color: ${themeColors.text} !important;
          text-decoration: none !important;
        }

        div.fc .fc-timegrid-slot,
        div.fc .fc-timegrid-slot-label,
        div.fc .fc-daygrid-day {
          background-color: ${themeColors.cardBg} !important;
        }

        div.fc .fc-day-today {
          background-color: ${themeColors.accentBg || 'rgba(33, 150, 243, 0.12)'} !important;
        }

        div.fc .fc-highlight {
          background-color: ${themeColors.primary} !important;
          opacity: 0.3 !important;
        }

        div.fc .fc-event {
          white-space: normal !important;
          padding: 2px 4px !important;
          font-size: 0.85rem !important;
        }
        div.fc .fc-event-title {
          font-weight: bold !important;
        }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={formattedEvents}
        eventDisplay="block"
        selectable={true}
        dayMaxEvents={false}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        dateClick={(info) => {
          const calendarApi = info.view.calendar
          calendarApi.changeView('timeGridDay', info.dateStr)
          if (onDateSelect) {
            onDateSelect(info.dateStr.slice(0, 10))
          }
        }}
        select={(selectInfo) => onDateSelect && onDateSelect(selectInfo.startStr.slice(0, 10))}
        eventClick={(clickInfo) => {
          const rawEvent = clickInfo.event.extendedProps.rawEvent
          const eventForModal = {
            ...rawEvent,
            date: clickInfo.event.startStr ? clickInfo.event.startStr.slice(0, 10) : rawEvent.date
          }
          if (onEventClick) {
            onEventClick(eventForModal)
          }
        }}
        height="auto"
      />
    </div>
  )
}