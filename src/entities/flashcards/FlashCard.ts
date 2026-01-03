export type FlashCardDoc = {
  _id: string
  _rev?: string
  type: 'flashcard'
  front: string
  back: string
  createdAt: string
  updatedAt: string
}
