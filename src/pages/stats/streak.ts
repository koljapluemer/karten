import { differenceInCalendarDays, format, startOfDay, subDays } from 'date-fns'

export type StreakDataPoint = {
  date: string
  count: number
}

const dateKey = (date: Date): string => format(date, 'yyyy-MM-dd')

export const calculateStreak = (
  data: StreakDataPoint[],
  today: Date = new Date()
): number => {
  if (data.length === 0) return 0

  const countsByDate = new Map<string, number>()
  for (const day of data) {
    countsByDate.set(day.date, (countsByDate.get(day.date) ?? 0) + day.count)
  }

  const todayStart = startOfDay(today)
  const earliestDate = data.reduce<Date | null>((earliest, day) => {
    const parsedDate = startOfDay(new Date(`${day.date}T00:00:00`))
    if (Number.isNaN(parsedDate.getTime())) return earliest
    if (earliest === null) return parsedDate
    return parsedDate < earliest ? parsedDate : earliest
  }, null)

  if (earliestDate === null) return 0

  const daysToCheck = differenceInCalendarDays(todayStart, earliestDate) + 1
  let currentStreak = 0
  let usedGraceMiss = false

  for (let i = 0; i < daysToCheck; i++) {
    const key = dateKey(subDays(todayStart, i))
    if ((countsByDate.get(key) ?? 0) > 0) {
      currentStreak++
      continue
    }

    if (usedGraceMiss) break
    usedGraceMiss = true
  }

  return currentStreak
}
