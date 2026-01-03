import type { CardDoc } from '@/entities/cards/Card'
import type { LearningProgressDoc } from '@/entities/progress/LearningProgress'
import type { PracticeLogDoc } from '@/entities/practice/PracticeLog'

export type DbDocument = CardDoc | LearningProgressDoc | PracticeLogDoc
