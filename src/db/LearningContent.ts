export interface LearningContent {
  id: string
  content: string
  relatedFlashcards: string[]
  owner?: string
  realmId?: string
}
