import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { DayData, PrayerLog } from '../types';
import { getCalendarDays, DAYS_OF_WEEK, MONTH_NAMES, calculateDuration } from '../utils/calendar';
import './Calendar.css';

export interface CalendarRef {
  goToToday: () => void;
}

export const Calendar = forwardRef<CalendarRef>((_props, ref) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prayerLogs, setPrayerLogs] = useState<Map<string, PrayerLog>>(new Map());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Load prayer logs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('prayerLogs');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPrayerLogs(new Map(Object.entries(parsed)));
    }
  }, []);

  // Save prayer logs to localStorage
  const saveLogs = (logs: Map<string, PrayerLog>) => {
    const obj = Object.fromEntries(logs);
    localStorage.setItem('prayerLogs', JSON.stringify(obj));
  };

  const calendarDays = getCalendarDays(currentYear, currentMonth);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  useImperativeHandle(ref, () => ({
    goToToday
  }));

  const toggleDay = (day: DayData) => {
    const targetMinutes = calculateDuration(day.date);
    if (targetMinutes === 0) return; // Don't log before schedule starts

    const newLogs = new Map(prayerLogs);
    const existing = newLogs.get(day.isoString);

    if (existing?.completed) {
      // Remove completion
      newLogs.delete(day.isoString);
    } else {
      // Mark as completed
      newLogs.set(day.isoString, {
        date: day.isoString,
        minutes: targetMinutes,
        completed: true
      });
    }

    setPrayerLogs(newLogs);
    saveLogs(newLogs);
  };

  const getMonthBaseMinutes = () => {
    // Find the first day with a duration > 0 in this month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Find the first day with a duration > 0 in this month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const duration = calculateDuration(date);
      if (duration > 0) {
        return duration;
      }
    }
    return 0;
  };

  const calculateMonthProgress = () => {
    const daysInMonth = calendarDays.filter(day => day.isCurrentMonth);
    const completedDays = daysInMonth.filter(day => {
      const log = prayerLogs.get(day.isoString);
      return log?.completed && calculateDuration(day.date) > 0;
    }).length;
    const totalDays = daysInMonth.filter(day => calculateDuration(day.date) > 0).length;

    return {
      completed: completedDays,
      total: totalDays,
      percentage: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
    };
  };

  const monthProgress = calculateMonthProgress();
  const monthBaseMinutes = getMonthBaseMinutes();

  const renderDay = (day: DayData) => {
    const targetMinutes = calculateDuration(day.date);
    const log = prayerLogs.get(day.isoString);
    const isCompleted = log?.completed || false;
    const isInactive = targetMinutes === 0;

    const dayClasses = [
      'calendar-day',
      !day.isCurrentMonth && 'other-month',
      day.isToday && 'today'
    ].filter(Boolean).join(' ');

    return (
      <div key={day.isoString} className={dayClasses}>
        <div className="day-content">
          <div className="day-number">{day.date.getDate()}</div>
          {targetMinutes > 0 && (
            <div className="day-target">{targetMinutes}m</div>
          )}
        </div>
        <div
          className={`day-checkbox ${isCompleted ? 'checked' : ''} ${isInactive ? 'inactive' : ''}`}
          onClick={() => !isInactive && toggleDay(day)}
        >
          {isCompleted && (
            <svg className="checkmark-icon" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="month-header-box">
        <button onClick={goToPreviousMonth} className="nav-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="month-info">
          <h2 className="month-title">{MONTH_NAMES[currentMonth]} {currentYear}</h2>
          {monthBaseMinutes > 0 && (
            <p className="month-base">
              Month Base: {monthBaseMinutes} min{monthBaseMinutes !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button onClick={goToNextMonth} className="nav-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="calendar-days-header">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarDays.map(renderDay)}
      </div>

      <div className="progress-container">
        <div className="progress-header">
          <span className="progress-label">MONTHLY PROGRESS</span>
          <span className="progress-percentage">{monthProgress.percentage}%</span>
        </div>
        <div className="progress-stats">
          {monthProgress.completed} / {monthProgress.total} days
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${monthProgress.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
});

Calendar.displayName = 'Calendar';
