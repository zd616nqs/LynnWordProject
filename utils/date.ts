import { ActivityLog } from '../types';

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateActivityStreak(activityLog: ActivityLog, startDate: Date = new Date()): number {
  let streak = 0;
  const checkDate = new Date(startDate);

  while (true) {
    const dateStr = getLocalDateKey(checkDate);
    const activity = activityLog[dateStr];
    if (activity?.added || activity?.reviewed) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

