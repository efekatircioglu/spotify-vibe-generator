import React, { useState } from 'react';
import styles from './Calendar.module.css';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}
function getTodayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CustomCalendar({ eventDates = [], onEventDayClick }) {
  const todayISO = getTodayISO();
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const { year, month } = viewDate;
  const firstDayOfWeek = getFirstDayOfWeek(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);

  // Build the days grid
  const days = [];
  // Days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(prevMonthYear, prevMonth, day);
    days.push({
      date,
      label: day,
      otherMonth: true,
      iso: `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    });
  }
  // Days in current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      label: i,
      otherMonth: false,
      iso: `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    });
  }
  // Days from next month to fill the grid
  const totalCells = Math.ceil((days.length) / 7) * 7;
  for (let i = days.length + 1; i <= totalCells; i++) {
    const day = i - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const date = new Date(nextMonthYear, nextMonth, day);
    days.push({
      date,
      label: day,
      otherMonth: true,
      iso: `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    });
  }

  // Navigation
  function handlePrev() {
    setViewDate(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  }
  function handleNext() {
    setViewDate(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  }

  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });

  return (
    <div className={styles['calendar-container']}>
      <div className={styles['calendar-header']}>
        <div className={styles['calendar-nav']}>
          <button onClick={handlePrev} aria-label="Previous Month">&#60;</button>
        </div>
        <h3>{monthName} {year}</h3>
        <div className={styles['calendar-nav']}>
          <button onClick={handleNext} aria-label="Next Month">&#62;</button>
        </div>
      </div>
      <div className={styles['calendar-grid']}>
        {WEEKDAYS.map(d => (
          <div key={d} className={styles['calendar-day-name']}>{d}</div>
        ))}
        {days.map(({ date, label, otherMonth, iso }, idx) => {
          const isToday = iso === todayISO;
          const hasEvent = eventDates.includes(iso);
          let classNames = styles['calendar-day'];
          if (otherMonth) classNames += ' ' + styles['other-month'];
          if (isToday) classNames += ' ' + styles['is-today'];
          if (hasEvent) classNames += ' ' + styles['has-event'];
          return (
            <div
              key={iso + idx}
              className={classNames}
              onClick={hasEvent ? () => onEventDayClick && onEventDayClick(iso) : undefined}
              style={hasEvent ? { cursor: 'pointer', pointerEvents: 'auto' } : {}}
              aria-label={hasEvent ? `Show events for ${iso}` : undefined}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
} 