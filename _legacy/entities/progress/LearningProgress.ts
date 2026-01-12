import type { CardInput } from 'ts-fsrs'

export type DeclarativeLearningProgressDoc = {
  _id: string
  _rev?: string
  type: 'learning-progress-declarative'
  cardId: string
  card?: CardInput
  totalReviews: number
}

export type ProceduralLearningProgressDoc = {
  _id: string
  _rev?: string
  type: 'learning-progress-procedural'
  cardId: string
  isAchieved: boolean
  practiceNextAt?: string
}

export type LearningProgressDoc = DeclarativeLearningProgressDoc | ProceduralLearningProgressDoc
