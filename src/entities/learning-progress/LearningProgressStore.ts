import { db } from '@/db/db'
import type { LearningProgress } from '@/db/db'
import type { LearningProgressDoc } from '../../db/LearningProgress'
import { fsrs, createEmptyCard, Rating, type Card } from 'ts-fsrs'

const flashcardIdToProgressId = (flashcardId: string): string => {
  return flashcardId.replace('flashcard:', 'learning-progress:')
}

export const loadLearningProgress = async (): Promise<LearningProgressDoc[]> => {
  return await db.learningProgress.toArray()
}

export const initializeNewCard = async (flashcardId: string): Promise<void> => {
  const now = new Date()
  const progressId = flashcardIdToProgressId(flashcardId)
  const initialCard = createEmptyCard(now)

  // Ensure plain object (not reactive proxy)
  const progressEntity: LearningProgress = {
    id: progressId,
    due: initialCard.due,
    stability: initialCard.stability,
    difficulty: initialCard.difficulty,
    elapsed_days: initialCard.elapsed_days,
    scheduled_days: initialCard.scheduled_days,
    learning_steps: initialCard.learning_steps,
    reps: initialCard.reps,
    lapses: initialCard.lapses,
    state: initialCard.state,
    last_review: initialCard.last_review
  }

  await db.learningProgress.add(progressEntity)
}

export const updateCardProgress = async (
  flashcardId: string,
  rating: Rating
): Promise<void> => {
  const now = new Date()
  const progressId = flashcardIdToProgressId(flashcardId)

  const existing = await db.learningProgress.get(progressId)
  if (!existing) throw new Error(`Progress ${progressId} not found`)

  const currentCard: Card = {
    due: existing.due,
    stability: existing.stability,
    difficulty: existing.difficulty,
    elapsed_days: existing.elapsed_days,
    scheduled_days: existing.scheduled_days,
    learning_steps: existing.learning_steps,
    reps: existing.reps,
    lapses: existing.lapses,
    state: existing.state,
    last_review: existing.last_review
  }

  const fsrsEngine = fsrs()
  const schedulingCards = fsrsEngine.repeat(currentCard, now)

  let updatedCard: Card
  if (rating === Rating.Again) {
    updatedCard = schedulingCards[Rating.Again].card
  } else if (rating === Rating.Hard) {
    updatedCard = schedulingCards[Rating.Hard].card
  } else if (rating === Rating.Good) {
    updatedCard = schedulingCards[Rating.Good].card
  } else {
    updatedCard = schedulingCards[Rating.Easy].card
  }

  // Ensure plain object (not reactive proxy)
  await db.learningProgress.update(progressId, {
    due: updatedCard.due,
    stability: updatedCard.stability,
    difficulty: updatedCard.difficulty,
    elapsed_days: updatedCard.elapsed_days,
    scheduled_days: updatedCard.scheduled_days,
    learning_steps: updatedCard.learning_steps,
    reps: updatedCard.reps,
    lapses: updatedCard.lapses,
    state: updatedCard.state,
    last_review: updatedCard.last_review
  })
}
