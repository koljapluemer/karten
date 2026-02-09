export interface LearningContent {
  id: string
  content: string
  relatedFlashcards: string[]
  tags: string[] // ids of `Tag`
  mediaIds?: string[] // ids of Media records
  owner?: string
  realmId?: string
}
