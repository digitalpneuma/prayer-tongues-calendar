export interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isoString: string;
}

export interface PrayerLog {
  date: string; // ISO string YYYY-MM-DD
  minutes: number;
  completed: boolean;
}
