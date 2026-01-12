export type LearningContentDoc = {
  _id: string
  _rev?: string
  docType: 'L'
  content: string
  relatedFlashcards: string[]
}
