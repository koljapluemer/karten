export interface LearningContent {
  id: string
  content: string
  relatedFlashcards: string[]
  tags: string[] // ids of `Tag`
  owner?: string
  realmId?: string
}
