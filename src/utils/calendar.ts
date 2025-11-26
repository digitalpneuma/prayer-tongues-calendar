import { DayData } from '../types';

export const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Generates the grid of days for a specific month/year.
 * Includes padding days from previous/next months to fill the grid.
 */
export const getCalendarDays = (year: number, month: number): DayData[] => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sunday) - 6 (Saturday)
  const daysInMonth = lastDayOfMonth.getDate();

  const days: DayData[] = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDate(date, new Date()),
      isoString: toIsoString(date)
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDate(date, new Date()),
      isoString: toIsoString(date)
    });
  }

  // Next month padding to complete the last row
  const remainingSlots = 42 - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDate(date, new Date()),
      isoString: toIsoString(date)
    });
  }

  return days;
};

// Simple YYYY-MM-DD formatter
export const toIsoString = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const d = new Date(date.getTime() - (offset * 60 * 1000));
  return d.toISOString().split('T')[0];
};

export const isSameDate = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// Precise Weekly Duration Map for 2026 based on the PDF
// Arrays represent the duration for the 1st, 2nd, 3rd, 4th, (and 5th) Sunday of that month.
// This handles all specific jumps and month transitions exactly as shown in the document.
const SCHEDULE_2026 = [
  [5, 6, 7, 9],            // Jan: Starts Jan 4.
  [10, 11, 12, 14],        // Feb
  [15, 16, 17, 18, 19],    // Mar: Week 5 (Mar 29) is 19m.
  [20, 21, 22, 24],        // Apr
  [25, 26, 27, 29, 30],    // May: Week 5 (May 31) is 30m.
  [31, 32, 33, 34],        // Jun
  [35, 36, 37, 39],        // Jul
  [40, 41, 42, 44, 45],    // Aug: Week 5 (Aug 30) is 45m (matches Sep start).
  [46, 47, 48, 49],        // Sep
  [50, 51, 52, 54],        // Oct
  [55, 56, 57, 58, 59],    // Nov: Week 5 (Nov 29) is 59m.
  [60, 60, 60, 60]         // Dec: All weeks 60m.
];

/**
 * Calculates the target duration based on the PDF schedule.
 * Logic:
 * 1. Find the Sunday that starts the current week.
 * 2. Look up that Sunday in the SCHEDULE_2026 map.
 * 3. Any dates before Jan 4, 2026 are 0.
 */
export const calculateDuration = (date: Date): number => {
  // 1. Determine the Sunday that starts this week
  const dayOfWeek = date.getDay(); // 0=Sun
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - dayOfWeek);

  // Normalize time
  weekStart.setHours(0, 0, 0, 0);

  // Hard Start Date: Jan 4, 2026
  const startDate = new Date(2026, 0, 4);
  if (weekStart < startDate) {
    return 0;
  }

  // 2. Identify the Month and Week Index of that Sunday
  const year = weekStart.getFullYear();

  // If we ever go beyond 2026, default to 60 or handle appropriately.
  // For this app, we strictly map 2026.
  if (year !== 2026) return 0;

  const monthIndex = weekStart.getMonth();

  // Find which Sunday of the month this is (0-indexed)
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const offset = (7 - firstDayOfMonth.getDay()) % 7;
  const firstSundayDate = 1 + offset;

  const currentSundayDate = weekStart.getDate();
  const weekIndex = Math.floor((currentSundayDate - firstSundayDate) / 7);

  // 3. Retrieve from Schedule
  const monthSchedule = SCHEDULE_2026[monthIndex];
  if (monthSchedule && weekIndex >= 0 && weekIndex < monthSchedule.length) {
    return monthSchedule[weekIndex];
  }

  return 0; // Fallback
};
