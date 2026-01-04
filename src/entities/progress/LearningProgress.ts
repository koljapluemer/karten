export type DeclarativeLearningProgressDoc = {
  _id: string
  _rev?: string
  type: 'learning-progress-declarative'
  cardId: string
  model: [number, number, number]
  lastReviewedAt: string
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
