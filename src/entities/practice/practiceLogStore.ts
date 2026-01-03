import { defineStore } from 'pinia'
import { ref } from 'vue'
import { format, subDays } from 'date-fns'
import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type { PracticeLogDoc } from './PracticeLog'

const buildLogId = (day: string): string => `practice-log:${day}:${crypto.randomUUID()}`

export const usePracticeLogStore = defineStore('practiceLog', () => {
  const practiceLogs = ref<PracticeLogDoc[]>([])
  const isLoaded = ref(false)

  const loadPracticeLogs = async (): Promise<void> => {
    if (isLoaded.value) return
    practiceLogs.value = await loadDocsByPrefix<PracticeLogDoc>('practice-log:')
    isLoaded.value = true
  }

  const logPractice = async (cardId: string, occurredAt: string): Promise<void> => {
    const day = format(new Date(occurredAt), 'yyyy-MM-dd')
    const log: PracticeLogDoc = {
      _id: buildLogId(day),
      type: 'practice-log',
      cardId,
      occurredAt,
      day
    }
    const result = await db.put(log)
    practiceLogs.value = [{ ...log, _rev: result.rev }, ...practiceLogs.value]
  }

  const getDailyPracticeCounts = (days = 14): { date: string; count: number }[] => {
    const counts = new Map<string, number>()
    practiceLogs.value.forEach((log) => {
      counts.set(log.day, (counts.get(log.day) ?? 0) + 1)
    })

    const results: { date: string; count: number }[] = []
    const today = new Date()
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = format(subDays(today, i), 'yyyy-MM-dd')
      results.push({ date, count: counts.get(date) ?? 0 })
    }
    return results
  }

  return {
    practiceLogs,
    isLoaded,
    loadPracticeLogs,
    logPractice,
    getDailyPracticeCounts
  }
})
