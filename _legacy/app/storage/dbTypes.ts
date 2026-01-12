import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import type { LearningProgressDoc } from '@/entities/progress/LearningProgress'
import type { MaterialDoc } from '@/entities/materials/Material'
import type { TopicDoc } from '@/entities/topics/Topic'

export type DbDocument =
  | FlashCardDoc
  | LearningProgressDoc
  | MaterialDoc
  | TopicDoc
