import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { format, subDays } from 'date-fns'
import * as ebisu from '@/entities/ebisu'
import { db } from '@/entities/storage/db'
import type { CardDoc, CardType } from './Card'
import type { LearningProgressDoc } from '@/entities/progress/LearningProgress'
import type { PracticeLogDoc } from '@/entities/practice/PracticeLog'

type CardCounts = Record<CardType | 'total', number>

const HOURS_IN_MS = 1000 * 60 * 60

const hoursSince = (isoTime: string): number => {
  const delta = Date.now() - Date.parse(isoTime)
  return Math.max(delta / HOURS_IN_MS, 0)
}

const buildCardId = (): string => `card:${crypto.randomUUID()}`
const buildProgressId = (cardId: string): string => `progress:${cardId}`
const buildLogId = (day: string): string => `practice-log:${day}:${crypto.randomUUID()}`

const defaultModel = (): [number, number, number] => {
  const model = ebisu.defaultModel(24)
  return [model[0], model[1], model[2]]
}

type AllDocsRow<T> = { doc?: T | null }

const loadDocsByPrefix = async <T extends { _id: string }>(prefix: string): Promise<T[]> => {
  const result = await db.allDocs({
    include_docs: true,
    startkey: prefix,
    endkey: `${prefix}\ufff0`
  })

  const rows = result.rows as AllDocsRow<T>[]
  return rows.flatMap((row) => (row.doc ? [row.doc] : []))
}

export const useCardsStore = defineStore('cards', () => {
  const cards = ref<CardDoc[]>([])
  const progress = ref<LearningProgressDoc[]>([])
  const practiceLogs = ref<PracticeLogDoc[]>([])
  const isLoaded = ref(false)

  const progressByCardId = computed<Record<string, LearningProgressDoc>>(() => {
    const map: Record<string, LearningProgressDoc> = {}
    progress.value.forEach((entry) => {
      map[entry.cardId] = entry
    })
    return map
  })

  const flashcards = computed(() => cards.value.filter((card) => card.cardType === 'flashcard'))

  const dueFlashcards = computed(() => {
    return flashcards.value.filter((card) => {
      const entry = progressByCardId.value[card._id]
      if (!entry) return false
      const recall = ebisu.predictRecall(entry.model, hoursSince(entry.lastReviewedAt), true)
      return recall < 0.9
    })
  })

  const unseenFlashcards = computed(() => {
    return flashcards.value.filter((card) => !progressByCardId.value[card._id])
  })

  const dueOrUnseenFlashcards = computed(() => [
    ...unseenFlashcards.value,
    ...dueFlashcards.value
  ])

  const cardCounts = computed<CardCounts>(() => {
    const counts: CardCounts = {
      total: cards.value.length,
      flashcard: 0,
      task: 0,
      content: 0
    }
    cards.value.forEach((card) => {
      counts[card.cardType] += 1
    })
    return counts
  })

  const loadAll = async (): Promise<void> => {
    if (isLoaded.value) return
    const [cardDocs, progressDocs, logDocs] = await Promise.all([
      loadDocsByPrefix<CardDoc>('card:'),
      loadDocsByPrefix<LearningProgressDoc>('progress:'),
      loadDocsByPrefix<PracticeLogDoc>('practice-log:')
    ])
    cards.value = cardDocs
    progress.value = progressDocs
    practiceLogs.value = logDocs
    isLoaded.value = true
  }

  const createFlashcard = async (front: string, back: string): Promise<CardDoc> => {
    const now = new Date().toISOString()
    const card: CardDoc = {
      _id: buildCardId(),
      type: 'card',
      cardType: 'flashcard',
      front,
      back,
      parents: [],
      createdAt: now,
      updatedAt: now
    }

    const result = await db.put(card)
    const stored = { ...card, _rev: result.rev }
    cards.value = [stored, ...cards.value]
    return stored
  }

  const upsertLearningProgress = async (
    cardId: string,
    score: number,
    occurredAt: string
  ): Promise<void> => {
    const existing = progressByCardId.value[cardId]
    const baseModel = existing?.model ?? defaultModel()
    const elapsedHours = existing ? hoursSince(existing.lastReviewedAt) : 1
    const updatedModel = ebisu.updateRecall(baseModel, score, 1, Math.max(elapsedHours, 0.01))

    const progressDoc: LearningProgressDoc = existing
      ? {
          ...existing,
          model: updatedModel,
          lastReviewedAt: occurredAt,
          totalReviews: existing.totalReviews + 1
        }
      : {
          _id: buildProgressId(cardId),
          type: 'learning-progress',
          cardId,
          model: updatedModel,
          lastReviewedAt: occurredAt,
          totalReviews: 1
        }

    const result = await db.put(progressDoc)
    const stored = { ...progressDoc, _rev: result.rev }
    if (existing) {
      progress.value = progress.value.map((entry) =>
        entry.cardId === cardId ? stored : entry
      )
    } else {
      progress.value = [stored, ...progress.value]
    }
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

  const recordFlashcardReview = async (cardId: string, score: number): Promise<void> => {
    const now = new Date().toISOString()
    await upsertLearningProgress(cardId, score, now)
    await logPractice(cardId, now)
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
    cards,
    progress,
    isLoaded,
    flashcards,
    dueFlashcards,
    unseenFlashcards,
    dueOrUnseenFlashcards,
    cardCounts,
    loadAll,
    createFlashcard,
    recordFlashcardReview,
    getDailyPracticeCounts
  }
})
