import { ref } from 'vue'
import type { CardDoc } from '@/entities/cards/Card'
import { useCardsStore } from '@/entities/cards/cardsStore'
import { takeRandom } from '@/dumb/random'

type PracticeScreen =
  | { name: 'loading' }
  | { name: 'choose' }
  | { name: 'adding'; step: number; total: number }
  | { name: 'lesson'; cards: CardDoc[]; index: number }

const MIN_LESSON = 3
const MAX_LESSON = 15
const ADDING_TOTAL = 3

const randomLessonTarget = (): number => {
  return Math.floor(Math.random() * (MAX_LESSON - MIN_LESSON + 1)) + MIN_LESSON
}

export const usePracticeFlow = () => {
  const store = useCardsStore()
  const screen = ref<PracticeScreen>({ name: 'loading' })

  const decideInitialScreen = () => {
    const hasDue = store.dueOrUnseenFlashcards.length > 0
    screen.value = hasDue
      ? { name: 'choose' }
      : { name: 'adding', step: 1, total: ADDING_TOTAL }
  }

  const start = async () => {
    await store.loadAll()
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
    const available = store.dueOrUnseenFlashcards
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
