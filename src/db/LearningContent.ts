export interface LearningContent {
  id: string
  content: string
  relatedFlashcards: string[]
  mediaIds?: string[] // ids of Media records
  owner?: string
  realmId?: string
}
