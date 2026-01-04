export type FlashCardDoc = {
  _id: string
  _rev?: string
  type: 'flashcard'
  cardType: 'declaritive' | 'procedural'
  front: string
  back: string
  requiresLearning: string[]
  overlapping: string[]
  createdAt: string
  updatedAt: string
}
