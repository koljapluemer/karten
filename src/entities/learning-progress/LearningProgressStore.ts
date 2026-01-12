import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type { LearningProgressDoc } from './LearningProgress'
import { fsrs, createEmptyCard, Rating, type Card } from 'ts-fsrs'

const flashcardIdToProgressId = (flashcardId: string): string => {
  return flashcardId.replace('flashcard:', 'learning-progress:')
}

export const loadLearningProgress = async (): Promise<LearningProgressDoc[]> => {
  return await loadDocsByPrefix<LearningProgressDoc>('learning-progress:')
}

export const initializeNewCard = async (flashcardId: string): Promise<void> => {
  const now = new Date()
  const progressId = flashcardIdToProgressId(flashcardId)

  const initialCard = createEmptyCard(now)

  const progressDoc: LearningProgressDoc = {
    _id: progressId,
    docType: 'P',
    ...initialCard
  }

  await db.put(progressDoc)
}

export const updateCardProgress = async (
  flashcardId: string,
  rating: Rating
): Promise<void> => {
  const now = new Date()
  const progressId = flashcardIdToProgressId(flashcardId)

  const existing = await db.get<LearningProgressDoc>(progressId)

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

  let updatedCard
  if (rating === Rating.Again) {
    updatedCard = schedulingCards[Rating.Again].card
  } else if (rating === Rating.Hard) {
    updatedCard = schedulingCards[Rating.Hard].card
  } else if (rating === Rating.Good) {
    updatedCard = schedulingCards[Rating.Good].card
  } else {
    updatedCard = schedulingCards[Rating.Easy].card
  }

  const progressDoc: LearningProgressDoc = {
    _id: progressId,
    _rev: existing._rev,
    docType: 'P',
    ...updatedCard
  }

  await db.put(progressDoc)
}
