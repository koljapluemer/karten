import type { LearningContentDoc } from '@/entities/learning-content/LearningContent'
import type { FlashCardDoc } from '@/entities/flashcard/Flashcard'
import type { LearningProgressDoc } from '@/entities/learning-progress/LearningProgress'

export type DbDocument = LearningContentDoc | FlashCardDoc | LearningProgressDoc
