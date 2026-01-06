import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import type { LearningProgressDoc } from '@/entities/progress/LearningProgress'
import type { TopicDoc } from '@/entities/topics/Topic'

export type DbDocument =
  | FlashCardDoc
  | LearningProgressDoc
  | TopicDoc
