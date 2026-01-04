import { computed, ref } from 'vue'
import * as ebisu from '@/entities/ebisu'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import { useProgressStore } from '@/entities/progress/progressStore'
import type {
  DeclarativeLearningProgressDoc,
  ProceduralLearningProgressDoc
} from '@/entities/progress/LearningProgress'
import { pickRandom } from '@/dumb/random'

export type PracticeScreen =
  | { name: 'loading' }
  | { name: 'add-declarative' }
  | { name: 'add-procedural' }
  | { name: 'followup-flashcards'; parentId: string }
  | { name: 'followup-goals'; parentId: string }
  | { name: 'required-goals'; parentId: string }
  | { name: 'required-flashcards-for-goal'; parentId: string }
  | { name: 'required-flashcards-for-card'; parentId: string }
  | { name: 'overlapping-flashcards'; parentId: string }
  | { name: 'overlapping-goals'; parentId: string }
  | { name: 'practice-flashcard'; cardId: string }
  | { name: 'practice-goal'; cardId: string }

const HOURS_IN_MS = 1000 * 60 * 60

const hoursSince = (isoTime: string): number => {
  const delta = Date.now() - Date.parse(isoTime)
  return Math.max(delta / HOURS_IN_MS, 0)
}

const getRecall = (entry: DeclarativeLearningProgressDoc): number => {
  return ebisu.predictRecall(entry.model, hoursSince(entry.lastReviewedAt), true)
}

export const usePracticeController = () => {
  const flashcardsStore = useFlashcardsStore()
  const progressStore = useProgressStore()
  const screen = ref<PracticeScreen>({ name: 'loading' })

  const cardsById = computed<Record<string, FlashCardDoc>>(() => {
    const map: Record<string, FlashCardDoc> = {}
    flashcardsStore.flashcards.forEach((card) => {
      map[card._id] = card
    })
    return map
  })

  const requirementsMet = (card: FlashCardDoc): boolean => {
    return card.requiresLearning.every((requiredId) => {
      const required = cardsById.value[requiredId]
      if (!required) return false
      const progress = progressStore.progressByCardId[requiredId]
      if (required.cardType === 'procedural') {
        return progress?.type === 'learning-progress-procedural' && progress.isAchieved
      }
      if (progress?.type !== 'learning-progress-declarative') return false
      return getRecall(progress) >= 0.9
    })
  }

  const declarativeCards = computed(() =>
    flashcardsStore.flashcards.filter((card) => card.cardType === 'declaritive')
  )

  const proceduralCards = computed(() =>
    flashcardsStore.flashcards.filter((card) => card.cardType === 'procedural')
  )

  const buildAvailableScreens = (): PracticeScreen[] => {
    const options: PracticeScreen[] = [{ name: 'add-declarative' }, { name: 'add-procedural' }]

    declarativeCards.value.forEach((card) => {
      const progress = progressStore.progressByCardId[card._id]
      if (progress?.type === 'learning-progress-declarative') {
        if (getRecall(progress) >= 0.8) {
          options.push({ name: 'followup-flashcards', parentId: card._id })
        }
      }

      options.push({ name: 'required-flashcards-for-card', parentId: card._id })
      options.push({ name: 'overlapping-flashcards', parentId: card._id })

      const isPracticeReady = requirementsMet(card)
      if (isPracticeReady) {
        if (!progress || progress.type !== 'learning-progress-declarative') {
          options.push({ name: 'practice-flashcard', cardId: card._id })
        } else if (getRecall(progress) < 0.9) {
          options.push({ name: 'practice-flashcard', cardId: card._id })
        }
      }
    })

    proceduralCards.value.forEach((card) => {
      const progress = progressStore.progressByCardId[card._id] as
        | ProceduralLearningProgressDoc
        | undefined

      options.push({ name: 'followup-goals', parentId: card._id })
      options.push({ name: 'required-flashcards-for-goal', parentId: card._id })
      options.push({ name: 'overlapping-goals', parentId: card._id })

      if (!progress || progress.type !== 'learning-progress-procedural') {
        options.push({ name: 'required-goals', parentId: card._id })
      }

      const isPracticeReady = requirementsMet(card)
      if (isPracticeReady) {
        const nextAt = progress?.practiceNextAt ? Date.parse(progress.practiceNextAt) : undefined
        if (!nextAt || nextAt <= Date.now()) {
          options.push({ name: 'practice-goal', cardId: card._id })
        }
      }
    })

    return options
  }

  const pickNextScreen = (): PracticeScreen => {
    if (!flashcardsStore.flashcards.length) return { name: 'add-declarative' }
    const candidate = pickRandom(buildAvailableScreens())
    return candidate ?? { name: 'add-declarative' }
  }

  const start = async (): Promise<void> => {
    screen.value = { name: 'loading' }
    await Promise.all([flashcardsStore.loadFlashcards(), progressStore.loadProgress()])
    screen.value = pickNextScreen()
  }

  const goToScreen = (next?: PracticeScreen) => {
    if (next) {
      screen.value = next
      return
    }
    screen.value = pickNextScreen()
  }

  return {
    screen,
    cardsById,
    start,
    goToScreen,
    pickNextScreen
  }
}
