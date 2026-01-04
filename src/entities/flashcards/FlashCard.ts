export type FlashCardDoc = {
  _id: string
  _rev?: string
  type: 'flashcard'
  front: string
  back: string
  overlapping: string[]
  createdAt: string
  updatedAt: string
}
