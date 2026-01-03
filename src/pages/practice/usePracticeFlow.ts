import { computed, ref } from 'vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import { useProgressStore } from '@/entities/progress/progressStore'
import * as ebisu from '@/entities/ebisu'
import { takeRandom } from '@/dumb/random'

type PracticeScreen =
  | { name: 'loading' }
  | { name: 'choose' }
  | { name: 'adding'; step: number; total: number }
  | { name: 'lesson'; cards: FlashCardDoc[]; index: number }

const MIN_LESSON = 3
const MAX_LESSON = 15
const ADDING_TOTAL = 3
const HOURS_IN_MS = 1000 * 60 * 60

const randomLessonTarget = (): number => {
  return Math.floor(Math.random() * (MAX_LESSON - MIN_LESSON + 1)) + MIN_LESSON
}

const hoursSince = (isoTime: string): number => {
  const delta = Date.now() - Date.parse(isoTime)
  return Math.max(delta / HOURS_IN_MS, 0)
}

export const usePracticeFlow = () => {
  const flashcardsStore = useFlashcardsStore()
  const progressStore = useProgressStore()
  const screen = ref<PracticeScreen>({ name: 'loading' })

  const dueFlashcards = computed(() => {
    return flashcardsStore.flashcards.filter((card) => {
      const entry = progressStore.progressByCardId[card._id]
      if (!entry) return false
      const recall = ebisu.predictRecall(entry.model, hoursSince(entry.lastReviewedAt), true)
      return recall < 0.9
    })
  })

  const unseenFlashcards = computed(() => {
    return flashcardsStore.flashcards.filter((card) => !progressStore.progressByCardId[card._id])
  })

  const dueOrUnseenFlashcards = computed(() => [
    ...unseenFlashcards.value,
    ...dueFlashcards.value
  ])

  const decideInitialScreen = () => {
    const hasDue = dueOrUnseenFlashcards.value.length > 0
    screen.value = hasDue
      ? { name: 'choose' }
      : { name: 'adding', step: 1, total: ADDING_TOTAL }
  }

  const start = async () => {
    await Promise.all([flashcardsStore.loadFlashcards(), progressStore.loadProgress()])
    decideInitialScreen()
  }

  const goToChoose = () => {
    screen.value = { name: 'choose' }
  }

  const startAddingFlow = () => {
    screen.value = { name: 'adding', step: 1, total: ADDING_TOTAL }
  }

  const handleCardAdded = () => {
    if (screen.value.name !== 'adding') return
    if (screen.value.step >= screen.value.total) {
      goToChoose()
    } else {
      screen.value = {
        name: 'adding',
        step: screen.value.step + 1,
        total: screen.value.total
      }
    }
  }

  const startLesson = () => {
    const target = randomLessonTarget()
    const available = dueOrUnseenFlashcards.value
    if (available.length === 0) {
      startAddingFlow()
      return
    }
    const cards = takeRandom(available, Math.min(target, available.length))
    screen.value = {
      name: 'lesson',
      cards,
      index: 0
    }
  }

  const advanceLesson = () => {
    if (screen.value.name !== 'lesson') return
    const nextIndex = screen.value.index + 1
    if (nextIndex >= screen.value.cards.length) {
      goToChoose()
      return
    }
    screen.value = {
      ...screen.value,
      index: nextIndex
    }
  }

  const completeLesson = () => {
    goToChoose()
  }

  return {
    screen,
    start,
    startAddingFlow,
    startLesson,
    advanceLesson,
    completeLesson,
    handleCardAdded,
    goToChoose
  }
}
