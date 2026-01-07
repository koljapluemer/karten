export type FlashCardDoc = {
  _id: string
  _rev?: string
  type: 'flashcard'
  cardType: 'declaritive' | 'procedural'
  front: string
  back: string
  instruction?: string
  requiresLearning: string[]
  overlapping: string[]
  logs?: Record<string, string>
  createdAt: string
  updatedAt: string
}
