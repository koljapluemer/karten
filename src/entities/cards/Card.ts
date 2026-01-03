export type CardType = 'flashcard' | 'task' | 'content'

export type CardDoc = {
  _id: string
  _rev?: string
  type: 'card'
  cardType: CardType
  front: string
  back?: string
  parents: string[]
  createdAt: string
  updatedAt: string
}

export const isFlashcard = (card: CardDoc): boolean => card.cardType === 'flashcard'
