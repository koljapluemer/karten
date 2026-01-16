import Dexie, { type EntityTable } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'
import type { FlashCard } from './Flashcard'
import type { LearningContent } from './LearningContent'
import type { LearningProgress } from './LearningProgress'
import type { ReviewCount } from './ReviewCount'







class KartenDatabase extends Dexie {
  declare flashcards: EntityTable<FlashCard, 'id'>
  declare learningContent: EntityTable<LearningContent, 'id'>
  declare learningProgress: EntityTable<LearningProgress, 'id'>
  declare reviewCounts: EntityTable<ReviewCount, 'id'>

  constructor() {
    super('karten', { addons: [dexieCloud] })

    this.version(1).stores({
      flashcards: 'id, *blockedBy, owner, realmId',
      learningContent: 'id, *relatedFlashcards, owner, realmId',
      learningProgress: 'id, due, owner, realmId'
    })

    this.version(2).stores({
      flashcards: 'id, *blockedBy, owner, realmId',
      learningContent: 'id, *relatedFlashcards, owner, realmId',
      learningProgress: 'id, due, owner, realmId',
      reviewCounts: 'id, date, owner, realmId'
    })
  }
}

export const db = new KartenDatabase()

db.cloud.configure({
  databaseUrl: import.meta.env.VITE_DEXIE_CLOUD_URL || 'https://xxxxx.dexie.cloud',
  requireAuth: false
})
