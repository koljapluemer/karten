import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import type { LearningProgressDoc } from '@/entities/progress/LearningProgress'

export type DbDocument =
  | FlashCardDoc
  | LearningProgressDoc
