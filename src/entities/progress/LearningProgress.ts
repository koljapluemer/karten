export type LearningProgressDoc = {
  _id: string
  _rev?: string
  type: 'learning-progress'
  cardId: string
  model: [number, number, number]
  lastReviewedAt: string
  totalReviews: number
}
