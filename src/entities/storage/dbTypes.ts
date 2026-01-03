import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import type { TaskCardDoc } from '@/entities/taskcards/TaskCard'
import type { LearningGoalDoc } from '@/entities/learning-goals/LearningGoal'
import type { LearningProgressDoc } from '@/entities/progress/LearningProgress'
import type { PracticeLogDoc } from '@/entities/practice/PracticeLog'

export type DbDocument =
  | FlashCardDoc
  | TaskCardDoc
  | LearningGoalDoc
  | LearningProgressDoc
  | PracticeLogDoc
